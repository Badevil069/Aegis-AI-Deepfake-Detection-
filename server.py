"""
Aegis Sentinel — Real-Time Detection Server
============================================
FastAPI + Socket.IO backend for deepfake detection.

Endpoints:
  POST /analyze-frame   — Analyze a single base64 frame (webcam/webrtc)
  POST /analyze-stream   — Start stream analysis (yt-dlp + ffmpeg)
  POST /stop-stream      — Stop active stream analysis
  GET  /api/health       — Health check

Socket.IO events:
  connect / disconnect
  join_room / leave_room       — WebRTC signaling rooms
  webrtc_offer / answer / ice  — WebRTC signaling
  stream_frame_result          — Server → Client detection results
  detection_result             — Server → Client frame analysis result

Existing endpoint preserved:
  POST /api/analyze      — File upload analysis (from main.py)
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

# Vertex AI / Cloud Vision engines — optional (may not have google-cloud libs installed)
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

# Track connected clients and rooms
connected_clients: dict[str, dict] = {}
rooms: dict[str, set] = {}


@sio.event
async def connect(sid, environ):
    connected_clients[sid] = {"joined_at": time.time()}
    logger.info(f"Client connected: {sid}")


@sio.event
async def disconnect(sid):
    # Clean up rooms
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

    # Notify existing participants
    existing = [
        {"sid": s, "username": connected_clients.get(s, {}).get("username", "Unknown")}
        for s in rooms[room_id]
        if s != sid
    ]
    await sio.emit("room_joined", {"room_id": room_id, "participants": existing}, to=sid)
    await sio.emit(
        "participant_joined",
        {"sid": sid, "username": username},
        room=room_id,
        skip_sid=sid,
    )
    logger.info(f"[{sid}] joined room {room_id} as {username}")


@sio.event
async def leave_room(sid, data):
    room_id = data.get("room_id")
    if room_id and room_id in rooms:
        rooms[room_id].discard(sid)
        await sio.leave_room(sid, room_id)
        await sio.emit("participant_left", {"sid": sid}, room=room_id, skip_sid=sid)
        if not rooms[room_id]:
            del rooms[room_id]


@sio.event
async def webrtc_offer(sid, data):
    target = data.get("target")
    if target:
        await sio.emit("webrtc_offer", {"sdp": data.get("sdp"), "from": sid}, to=target)


@sio.event
async def webrtc_answer(sid, data):
    target = data.get("target")
    if target:
        await sio.emit("webrtc_answer", {"sdp": data.get("sdp"), "from": sid}, to=target)


@sio.event
async def webrtc_ice(sid, data):
    target = data.get("target")
    if target:
        await sio.emit("webrtc_ice", {"candidate": data.get("candidate"), "from": sid}, to=target)


@sio.event
async def analyze_webcam_frame(sid, data):
    """Receive a base64 frame from webcam, analyze, and return result."""
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


@sio.event
async def analyze_webrtc_frame(sid, data):
    """Receive a base64 frame from a WebRTC participant, analyze it."""
    try:
        b64_frame = data.get("frame", "")
        participant_sid = data.get("participant_sid", sid)
        frame = cv_detector.decode_base64_frame(b64_frame)
        if frame is None:
            return

        result = analyze_single_frame(frame)
        result["source"] = "webrtc"
        result["participant_sid"] = participant_sid
        await sio.emit("detection_result", result, to=sid)

    except Exception as e:
        logger.error(f"WebRTC frame analysis error: {e}")


# ═══════════════════════════════════════════
#  FASTAPI APPLICATION
# ═══════════════════════════════════════════

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Aegis Sentinel server starting...")
    yield
    # Cleanup active streams
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
    frame: str  # base64-encoded JPEG


class StreamRequest(BaseModel):
    url: str
    sid: Optional[str] = None  # Socket.IO session id for streaming results


class StopStreamRequest(BaseModel):
    session_id: str


# ── Health check ──

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


# ── Frame analysis endpoint (REST fallback) ──

@app.post("/analyze-frame")
async def analyze_frame_endpoint(req: FrameRequest):
    """Analyze a single base64-encoded frame via REST."""
    try:
        frame = cv_detector.decode_base64_frame(req.frame)
        if frame is None:
            raise HTTPException(status_code=400, detail="Could not decode frame")
        result = analyze_single_frame(frame)
        result["source"] = "rest"
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Stream analysis endpoint ──

@app.post("/analyze-stream")
async def start_stream_analysis(req: StreamRequest):
    """
    Start analyzing a live stream URL.
    Uses yt-dlp to resolve the stream and FFmpeg to extract frames.
    Results are pushed via Socket.IO to the requesting client.
    """
    session_id = str(uuid.uuid4())[:8]
    stream_url = req.url.strip()
    client_sid = req.sid

    if not stream_url:
        raise HTTPException(status_code=400, detail="Stream URL is required")

    # Start background processing
    active_streams[session_id] = {"active": True, "process": None, "url": stream_url}

    async def process_stream():
        resolved_url = stream_url
        ffmpeg_proc = None

        try:
            # Step 1: Resolve with yt-dlp (for YouTube/Twitch etc.)
            if client_sid:
                await sio.emit("stream_status", {
                    "session_id": session_id,
                    "status": "resolving",
                    "message": "Resolving stream URL with yt-dlp..."
                }, to=client_sid)

            try:
                ytdlp_result = await asyncio.get_event_loop().run_in_executor(
                    None,
                    lambda: subprocess.run(
                        ["yt-dlp", "-f", "best[height<=720]", "-g", stream_url],
                        capture_output=True, text=True, timeout=30,
                    )
                )
                if ytdlp_result.returncode == 0 and ytdlp_result.stdout.strip():
                    resolved_url = ytdlp_result.stdout.strip().split("\n")[0]
                    logger.info(f"Resolved stream URL: {resolved_url[:80]}...")
            except FileNotFoundError:
                logger.warning("yt-dlp not found, will try direct URL")
            except Exception as e:
                logger.warning(f"yt-dlp failed: {e}, trying direct URL")

            # Step 2: Extract frames with FFmpeg
            if client_sid:
                await sio.emit("stream_status", {
                    "session_id": session_id,
                    "status": "connecting",
                    "message": "Connecting to stream via FFmpeg..."
                }, to=client_sid)

            cmd = [
                "ffmpeg",
                "-i", resolved_url,
                "-vf", "fps=2,scale=640:-1",  # 2 FPS, max 640px wide
                "-f", "image2pipe",
                "-vcodec", "mjpeg",
                "-q:v", "5",
                "-an",  # No audio
                "pipe:1",
            ]

            ffmpeg_proc = subprocess.Popen(
                cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
            )
            active_streams[session_id]["process"] = ffmpeg_proc

            if client_sid:
                await sio.emit("stream_status", {
                    "session_id": session_id,
                    "status": "analyzing",
                    "message": "Stream connected. Analyzing frames..."
                }, to=client_sid)

            # Read JPEG frames from pipe
            buffer = b""
            frame_count = 0
            jpeg_start = b"\xff\xd8"
            jpeg_end = b"\xff\xd9"

            while active_streams.get(session_id, {}).get("active", False):
                chunk = await asyncio.get_event_loop().run_in_executor(
                    None, lambda: ffmpeg_proc.stdout.read(4096)
                )
                if not chunk:
                    break

                buffer += chunk

                while jpeg_start in buffer and jpeg_end in buffer:
                    start_idx = buffer.index(jpeg_start)
                    end_idx = buffer.index(jpeg_end, start_idx) + 2
                    jpeg_data = buffer[start_idx:end_idx]
                    buffer = buffer[end_idx:]

                    # Decode and analyze
                    nparr = np.frombuffer(jpeg_data, np.uint8)
                    frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                    if frame is not None:
                        frame_count += 1
                        result = analyze_single_frame(frame)
                        result["source"] = "stream"
                        result["session_id"] = session_id
                        result["frame_number"] = frame_count

                        if client_sid:
                            await sio.emit("stream_frame_result", result, to=client_sid)

                        # Don't overwhelm — cap at ~2 results/sec
                        await asyncio.sleep(0.1)

        except Exception as e:
            logger.error(f"Stream processing error: {e}")
            if client_sid:
                await sio.emit("stream_status", {
                    "session_id": session_id,
                    "status": "error",
                    "message": str(e),
                }, to=client_sid)
        finally:
            if ffmpeg_proc and ffmpeg_proc.poll() is None:
                ffmpeg_proc.terminate()
            active_streams.pop(session_id, None)
            if client_sid:
                await sio.emit("stream_status", {
                    "session_id": session_id,
                    "status": "stopped",
                    "message": "Stream analysis stopped."
                }, to=client_sid)

    asyncio.create_task(process_stream())

    return {"session_id": session_id, "status": "started", "url": stream_url}


@app.post("/stop-stream")
async def stop_stream(req: StopStreamRequest):
    """Stop an active stream analysis session."""
    session = active_streams.get(req.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    session["active"] = False
    proc = session.get("process")
    if proc and proc.poll() is None:
        proc.terminate()
    return {"status": "stopped", "session_id": req.session_id}


# ── Preserved: File upload analysis ──

@app.post("/api/analyze")
async def analyze_evidence(file: UploadFile = File(...)):
    """Existing unified endpoint for scanning an uploaded file."""
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
        elif is_image and not ai_available:
            # Use CV fallback for image analysis
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
#  ASGI APP — Mount Socket.IO
# ═══════════════════════════════════════════

combined_app = socketio.ASGIApp(sio, other_asgi_app=app)


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("BACKEND_PORT", "8000"))
    logger.info(f"Starting Aegis Sentinel on port {port}")
    uvicorn.run(combined_app, host="0.0.0.0", port=port, log_level="info")
