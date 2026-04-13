"""
Aegis Sentinel — Real-Time Detection Server
============================================
FastAPI + Socket.IO backend for deepfake detection.
"""

import os
import sys
import json
import time
import base64
import asyncio
import subprocess
import tempfile
import uuid
import logging
from typing import Optional
from contextlib import asynccontextmanager

import cv2
import numpy as np
import socketio
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# ── Engine imports ──
from engines.cv_detector import CVDetector
from engines.email_analyzer import analyze_email_source  # UPDATED: Import new engine

# Vertex AI / Cloud Vision engines — optional
try:
    from engines.analyzer import DetectionLogic
except ImportError:
    DetectionLogic = None

try:
    from engines.auditor import DocumentAuditor
except ImportError:
    DocumentAuditor = None

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("aegis-server")

# ═══════════════════════════════════════════
#  DETECTION ENGINE SETUP
# ═══════════════════════════════════════════

cv_detector = CVDetector()

# Try to initialize Vertex AI-powered detector
try:
    if DetectionLogic is not None:
        ai_detector = DetectionLogic()
        ai_available = ai_detector.model is not None
    else:
        ai_detector = None
        ai_available = False
        logger.info("Vertex AI engine not available (google-cloud libs not installed).")
except Exception as e:
    logger.warning(f"Vertex AI detector not available: {e}")
    ai_detector = None
    ai_available = False

# Try to initialize Document Auditor
try:
    if DocumentAuditor is not None:
        auditor = DocumentAuditor()
    else:
        auditor = None
except Exception as e:
    logger.warning(f"Document auditor not available: {e}")
    auditor = None

logger.info(f"Detection engine: {'Vertex AI (Gemini 1.5 Pro)' if ai_available else 'CV Fallback (OpenCV)'}")

# ═══════════════════════════════════════════
#  ACTIVE STREAM SESSIONS
# ═══════════════════════════════════════════

active_streams: dict[str, dict] = {}  # session_id → {process, task, active}

def analyze_single_frame(frame: np.ndarray) -> dict:
    """Analyze a frame using AI engine if available, else CV fallback."""
    if ai_available and ai_detector:
        try:
            result = ai_detector.analyze_frame(frame)
            score = int(result.get("confidence", 0.5) * 100)
            is_fake = result.get("is_deepfake", False)
            return {
                "risk_score": score if is_fake else max(5, 100 - score),
                "status": "FAKE" if is_fake else ("SUSPICIOUS" if score > 60 else "REAL"),
                "details": result.get("details", []),
                "face_count": 1 if result.get("biometric_baseline_match") else 0,
                "artifacts": [d for d in result.get("details", []) if "artifact" in d.lower() or "anomal" in d.lower()],
                "processing_time_ms": 0,
                "timestamp": time.time(),
                "engine": "vertex_ai",
            }
        except Exception as e:
            logger.error(f"AI engine failed, falling back to CV: {e}")

    return cv_detector.analyze_frame(frame)

# ═══════════════════════════════════════════
#  SOCKET.IO SERVER
# ═══════════════════════════════════════════

sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins="*",
    logger=False,
    engineio_logger=False,
)

connected_clients: dict[str, dict] = {}
rooms: dict[str, set] = {}

@sio.event
async def connect(sid, environ):
    connected_clients[sid] = {"joined_at": time.time()}
    logger.info(f"Client connected: {sid}")

@sio.event
async def disconnect(sid):
    for room_id, members in list(rooms.items()):
        if sid in members:
            members.discard(sid)
            await sio.emit("participant_left", {"sid": sid}, room=room_id, skip_sid=sid)
            if not members:
                del rooms[room_id]
    connected_clients.pop(sid, None)
    logger.info(f"Client disconnected: {sid}")

@sio.event
async def join_room(sid, data):
    room_id = data.get("room_id", "default")
    username = data.get("username", f"User-{sid[:6]}")
    if room_id not in rooms:
        rooms[room_id] = set()
    rooms[room_id].add(sid)
    await sio.enter_room(sid, room_id)
    connected_clients[sid]["room_id"] = room_id
    connected_clients[sid]["username"] = username
    existing = [
        {"sid": s, "username": connected_clients.get(s, {}).get("username", "Unknown")}
        for s in rooms[room_id]
        if s != sid
    ]
    await sio.emit("room_joined", {"room_id": room_id, "participants": existing}, to=sid)
    await sio.emit("participant_joined", {"sid": sid, "username": username}, room=room_id, skip_sid=sid)

@sio.event
async def webrtc_offer(sid, data):
    target = data.get("target")
    if target: await sio.emit("webrtc_offer", {"sdp": data.get("sdp"), "from": sid}, to=target)

@sio.event
async def webrtc_answer(sid, data):
    target = data.get("target")
    if target: await sio.emit("webrtc_answer", {"sdp": data.get("sdp"), "from": sid}, to=target)

@sio.event
async def webrtc_ice(sid, data):
    target = data.get("target")
    if target: await sio.emit("webrtc_ice", {"candidate": data.get("candidate"), "from": sid}, to=target)

@sio.event
async def analyze_webcam_frame(sid, data):
    try:
        b64_frame = data.get("frame", "")
        frame = cv_detector.decode_base64_frame(b64_frame)
        if frame is None:
            await sio.emit("detection_result", {"error": "Could not decode frame"}, to=sid)
            return
        result = analyze_single_frame(frame)
        result["source"] = "webcam"
        result["sid"] = sid
        await sio.emit("detection_result", result, to=sid)
    except Exception as e:
        await sio.emit("detection_result", {"error": str(e)}, to=sid)

# ═══════════════════════════════════════════
#  FASTAPI APPLICATION
# ═══════════════════════════════════════════

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Aegis Sentinel server starting...")
    yield
    for session_id, session in active_streams.items():
        session["active"] = False
        proc = session.get("process")
        if proc and proc.poll() is None:
            proc.terminate()
    logger.info("Aegis Sentinel server stopped.")

app = FastAPI(title="Aegis Sentinel — Real-Time Detection Server", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Request models ──

class FrameRequest(BaseModel):
    frame: str

class StreamRequest(BaseModel):
    url: str
    sid: Optional[str] = None

class StopStreamRequest(BaseModel):
    session_id: str

class EmailRequest(BaseModel):  # UPDATED: Added EmailRequest model
    email_content: str

# ── Endpoints ──

@app.get("/")
def health():
    return {
        "status": "Aegis Sentinel Operational",
        "engine": "vertex_ai" if ai_available else "cv_fallback",
        "active_streams": len(active_streams),
    }

@app.get("/api/health")
def api_health():
    return {"status": "ok", "engine": "vertex_ai" if ai_available else "cv_fallback"}

@app.post("/analyze-frame")
async def analyze_frame_endpoint(req: FrameRequest):
    try:
        frame = cv_detector.decode_base64_frame(req.frame)
        if frame is None:
            raise HTTPException(status_code=400, detail="Could not decode frame")
        result = analyze_single_frame(frame)
        result["source"] = "rest"
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# UPDATED: Added analyze-email endpoint
@app.post("/api/analyze-email")
async def analyze_email_endpoint(req: EmailRequest):
    """Analyze a pasted email source for phishing/spoofing."""
    try:
        if not req.email_content.strip():
            raise HTTPException(status_code=400, detail="Email content cannot be empty")
        
        result = analyze_email_source(req.email_content)
        
        if not result.get("success"):
            raise HTTPException(status_code=500, detail=result.get("error"))
            
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Email analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/analyze")
async def analyze_evidence(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        filename = file.filename
        is_image = filename.lower().endswith((".png", ".jpg", ".jpeg"))

        doc_result = {"is_tampered": False, "details": ["Auditor not available"]}
        if auditor:
            doc_result = auditor.audit_document(contents, filename)

        img_result = {"is_deepfake": False, "confidence": 0.0, "details": ["Not supported"]}
        if is_image and ai_available and ai_detector:
            img_result = ai_detector.analyze_static_image(contents)
        elif is_image:
            frame = cv_detector.decode_raw_bytes(contents)
            if frame is not None:
                cv_result = cv_detector.analyze_frame(frame)
                img_result = {
                    "is_deepfake": cv_result["status"] == "FAKE",
                    "confidence": cv_result["risk_score"] / 100.0,
                    "details": cv_result["details"],
                }

        final_risk = "SAFE"
        if doc_result.get("is_tampered") or img_result.get("is_deepfake"):
            final_risk = "DANGER: HIGH PROBABILITY OF FRAUD/MANIPULATION"

        return {
            "status": "success",
            "filename": filename,
            "risk_assessment": final_risk,
            "cloud_vision_audit": doc_result,
            "gemini_visual_scan": img_result,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ═══════════════════════════════════════════
#  ASGI APP — Mount Socket.IO
# ═══════════════════════════════════════════

combined_app = socketio.ASGIApp(sio, other_asgi_app=app)

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("BACKEND_PORT", "8000"))
    logger.info(f"Starting Aegis Sentinel on port {port}")
    uvicorn.run(combined_app, host="0.0.0.0", port=port, log_level="info")