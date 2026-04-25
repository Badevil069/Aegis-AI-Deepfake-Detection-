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
from fastapi import FastAPI, File, UploadFile, HTTPException, WebSocket, WebSocketDisconnect, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
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

if ai_available and ai_detector:
    logger.info(f"Detection engine: Vertex AI ({getattr(ai_detector, 'model_name', 'configured-model')})")
else:
    logger.info("Detection engine: CV Fallback (OpenCV)")

VERTEX_DOCUMENT_REVIEW_POLICY = os.getenv("VERTEX_DOCUMENT_REVIEW_POLICY", "suspicious_only").lower()
if VERTEX_DOCUMENT_REVIEW_POLICY not in {"off", "always", "suspicious_only", "fallback"}:
    VERTEX_DOCUMENT_REVIEW_POLICY = "suspicious_only"


def should_run_vertex_document_review(doc_result: dict) -> bool:
    """Cost-aware policy for optional Vertex second-pass document review."""
    if not ai_available or not ai_detector:
        return False

    if VERTEX_DOCUMENT_REVIEW_POLICY == "off":
        return False
    if VERTEX_DOCUMENT_REVIEW_POLICY == "always":
        return True

    details = [d.lower() for d in doc_result.get("details", []) if isinstance(d, str)]
    metadata = doc_result.get("metadata", {}) if isinstance(doc_result.get("metadata", {}), dict) else {}
    auditor_unavailable = any(
        "auditor not available" in d
        or "cloud vision api unavailable" in d
        or "unable to run cloud vision" in d
        for d in details
    )
    suspicious = bool(doc_result.get("is_tampered") or doc_result.get("metadata_integrity") is False)
    local_fallback_used = bool(metadata.get("local_fallback_used", True))
    cloud_vision_failed = metadata.get("cloud_vision_status") in {"fallback", "error", "unavailable"}

    if VERTEX_DOCUMENT_REVIEW_POLICY == "fallback":
        return auditor_unavailable or local_fallback_used

    # Default: suspicious_only
    return suspicious or local_fallback_used or cloud_vision_failed

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
            
            if score == 0 and not is_fake:
                risk_score = 0
            else:
                risk_score = score if is_fake else max(5, 100 - score)
                
            if risk_score >= 70:
                status = "FAKE"
            elif risk_score >= 40:
                status = "SUSPICIOUS"
            else:
                status = "REAL"
                
            return {
                "risk_score": risk_score,
                "status": status,
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

# ── Endpoints & Websockets ──

live_stream_websockets = []

@app.websocket("/ws/live")
async def websocket_live_endpoint(websocket: WebSocket):
    await websocket.accept()
    live_stream_websockets.append(websocket)
    try:
        while True:
            data = await websocket.receive_text()
    except Exception as e:
        print("WebSocket error:", e)
    finally:
        if websocket in live_stream_websockets:
            live_stream_websockets.remove(websocket)
        try:
            await websocket.close()
        except Exception:
            pass

@app.websocket("/ws/live-call")
async def live_call(ws: WebSocket):
    await ws.accept()
    try:
        while True:
            data = await ws.receive_json()
            image_data = data.get("image", "")
            if image_data.startswith("data:image"):
                image_data = image_data.split(",")[1]
            
            frame = cv_detector.decode_base64_frame(image_data)
            if frame is None:
                continue
            
            start_t = time.time()
            
            # Skip if no face detected
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            faces = cv_detector.face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))
            face_count = len(faces)
            
            if face_count == 0:
                latency = int((time.time() - start_t) * 1000)
                await ws.send_json({
                    "user": data.get("user", "User"),
                    "room": data.get("room", "Room"),
                    "fake_score": 0.0,
                    "status": "REAL",
                    "faces": 0,
                    "latency": latency,
                    "artifacts": ["No face detected in frame."]
                })
                continue
                
            result = analyze_single_frame(frame)
            latency = int((time.time() - start_t) * 1000)
            
            score = result.get("risk_score", 0) / 100.0
            
            if score > 0.8:
                status = "FAKE"
            elif score > 0.5:
                status = "SUSPICIOUS"
            else:
                status = "REAL"
                
            await ws.send_json({
                "user": data.get("user", "User"),
                "room": data.get("room", "Room"),
                "fake_score": score,
                "status": status,
                "faces": result.get("face_count", 0),
                "latency": latency,
                "artifacts": result.get("artifacts", [])
            })
    except Exception as e:
        print("WebSocket error:", e)
    finally:
        try:
            await ws.close()
        except Exception:
            pass

async def broadcast_stream_update(data: dict):
    for ws in live_stream_websockets:
        try:
            await ws.send_json(data)
        except Exception:
            pass

async def process_stream_task(url: str, session_id: str):
    from engines.interceptor import LiveStreamInterceptor
    interceptor = LiveStreamInterceptor(fps=5)
    
    await broadcast_stream_update({"status_msg": "extracting", "message": "Extracting stream URL..."})
    
    loop = asyncio.get_event_loop()
    # Run in executor to prevent blocking
    success = await loop.run_in_executor(None, interceptor.start_stream, url)
    
    if not success:
        await broadcast_stream_update({"status_msg": "Error", "message": "Stream extraction failed or unsupported"})
        active_streams.pop(session_id, None)
        return
        
    await broadcast_stream_update({"status_msg": "processing", "message": "Opening stream..."})
    await asyncio.sleep(0.5)
    
    await broadcast_stream_update({"status_msg": "Live", "message": "Stream connected. Analyzing..."})
    
    frames_processed = 0
    frame_counter = 0
    
    while active_streams.get(session_id, {}).get("active", False):
        frame = await loop.run_in_executor(None, interceptor.get_next_frame)
        if frame is None:
            await broadcast_stream_update({"status_msg": "Error", "message": "Stream disconnected"})
            break
            
        frame_counter += 1
        # Process every 10 frames
        if frame_counter % 10 != 0:
            continue
            
        start_t = time.time()
        
        # Check for face first to skip API
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = cv_detector.face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))
        face_count = len(faces)
        
        if face_count == 0:
            latency = int((time.time() - start_t) * 1000)
            await broadcast_stream_update({
                "fake_score": 0.0,
                "status": "REAL",
                "faces": 0,
                "latency": latency,
                "frames_processed": frames_processed
            })
            continue
            
        # Run analyze_single_frame in thread too to avoid blocking loop
        result = await loop.run_in_executor(None, analyze_single_frame, frame)
        latency = int((time.time() - start_t) * 1000)
        frames_processed += 1
        
        score = result.get("risk_score", 0) / 100.0
        
        payload = {
            "fake_score": score,
            "status": result.get("status", "REAL"),
            "faces": result.get("face_count", face_count),
            "latency": latency,
            "frames_processed": frames_processed
        }
        await broadcast_stream_update(payload)

    interceptor.stop_stream()
    await broadcast_stream_update({"status_msg": "Stopped"})
    active_streams.pop(session_id, None)

@app.post("/start-detection")
async def start_detection(request: Request):
    try:
        data = await request.json()
        url = data.get("url")

        if not url:
            return {"status": "error", "message": "No URL provided"}

        session_id = str(uuid.uuid4())
        active_streams[session_id] = {"active": True}
        asyncio.create_task(process_stream_task(url, session_id))
        return {"status": "success", "session_id": session_id}
    except Exception as e:
        print("Backend error:", str(e))
        return {"status": "error", "message": str(e)}

@app.post("/stop-detection")
async def stop_detection(req: StopStreamRequest):
    if req.session_id in active_streams:
        active_streams[req.session_id]["active"] = False
    return {"status": "stopped"}

@app.get("/api/health")
def api_health():
    return {
        "status": "Aegis Sentinel Operational",
        "engine": "vertex_ai" if ai_available else "cv_fallback",
        "active_streams": len(active_streams),
    }

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

        img_result = {
            "is_deepfake": False,
            "confidence": 0.0,
            "details": ["Vertex document reviewer skipped by policy."],
            "review_mode": "skipped",
        }

        if should_run_vertex_document_review(doc_result):
            img_result = ai_detector.review_document(
                contents,
                filename,
                audit_findings=doc_result.get("details", []),
                document_text=doc_result.get("extracted_text", ""),
            )
        elif is_image and ai_available and ai_detector:
            img_result = ai_detector.analyze_static_image(contents)
        elif is_image:
            frame = cv_detector.decode_raw_bytes(contents)
            if frame is not None:
                cv_result = cv_detector.analyze_frame(frame)
                img_result = {
                    "is_deepfake": cv_result["status"] == "FAKE",
                    "confidence": cv_result["risk_score"] / 100.0,
                    "details": cv_result["details"],
                    "review_mode": "cv_fallback",
                }

        final_risk = "SAFE"
        if doc_result.get("is_tampered") or img_result.get("is_deepfake"):
            final_risk = "DANGER: HIGH PROBABILITY OF FRAUD/MANIPULATION"

        return {
            "status": "success",
            "filename": filename,
            "risk_assessment": final_risk,
            "vertex_document_review_policy": VERTEX_DOCUMENT_REVIEW_POLICY,
            "cloud_vision_audit": doc_result,
            "gemini_visual_scan": img_result,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ═══════════════════════════════════════════
#  STATIC FRONTEND SERVING (For Deployment)
# ═══════════════════════════════════════════

client_dist_path = os.path.join(os.path.dirname(__file__), "client", "dist")

if os.path.isdir(client_dist_path):
    # Mount the assets directory directly
    app.mount("/assets", StaticFiles(directory=os.path.join(client_dist_path, "assets")), name="assets")

    # Catch-all route for SPA (React Router)
    @app.api_route("/{path_name:path}", methods=["GET"])
    async def catch_all(path_name: str):
        if path_name.startswith("api/") or path_name.startswith("ws/") or path_name.startswith("socket.io/"):
            raise HTTPException(status_code=404, detail="Not Found")
            
        file_path = os.path.join(client_dist_path, path_name)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
            
        index_path = os.path.join(client_dist_path, "index.html")
        if os.path.isfile(index_path):
            return FileResponse(index_path)
            
        return {"status": "Aegis Sentinel API running (Frontend Not Built)"}
else:
    @app.get("/")
    def index_fallback():
        return {"status": "Aegis Sentinel API running. Frontend not found in client/dist."}

# ═══════════════════════════════════════════
#  ASGI APP — Mount Socket.IO
# ═══════════════════════════════════════════

combined_app = socketio.ASGIApp(sio, other_asgi_app=app)

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("BACKEND_PORT", "8000"))
    logger.info(f"Starting Aegis Sentinel on port {port}")
    uvicorn.run(combined_app, host="0.0.0.0", port=port, log_level="info")