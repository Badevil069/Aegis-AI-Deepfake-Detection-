import cv2
import logging
import subprocess
import sys
try:
    import streamlink
    STREAMLINK_AVAILABLE = True
except ImportError:
    STREAMLINK_AVAILABLE = False
import time
import numpy as np


logger = logging.getLogger("aegis-stream")

class LiveStreamInterceptor:
    def __init__(self, fps=5):
        self.fps = fps
        self.is_running = False
        self.cap = None
        self.last_error = None

    def _pick_stream_url(self, raw_output):
        """Select a single playable URL from yt-dlp output."""
        lines = [line.strip() for line in (raw_output or "").splitlines() if line.strip()]
        if not lines:
            return None

        # Prefer HLS URLs for better compatibility with OpenCV/FFmpeg.
        for line in lines:
            if ".m3u8" in line:
                return line
        return lines[0]

    def _extract_with_ytdlp(self, url):
        """Resolve stream URL using yt-dlp from the active Python environment."""
        commands = [
            [
                sys.executable,
                "-m",
                "yt_dlp",
                "--no-playlist",
                "--no-warnings",
                "--quiet",
                "-f",
                "best",
                "-g",
                url,
            ],
            [
                sys.executable,
                "-m",
                "yt_dlp",
                "--no-playlist",
                "--no-warnings",
                "--quiet",
                "-f",
                "best*[vcodec!=none]/best",
                "-g",
                url,
            ],
        ]

        errors = []
        for cmd in commands:
            try:
                result = subprocess.run(
                    cmd,
                    capture_output=True,
                    text=True,
                    timeout=30,
                )
            except subprocess.TimeoutExpired:
                errors.append("yt-dlp timed out while resolving the stream URL.")
                continue
            except Exception as exc:
                errors.append(f"yt-dlp execution error: {exc}")
                continue

            if result.returncode != 0:
                stderr = (result.stderr or "").strip()
                stdout = (result.stdout or "").strip()
                errors.append(stderr or stdout or f"yt-dlp exited with code {result.returncode}")
                continue

            stream_url = self._pick_stream_url(result.stdout)
            if stream_url:
                return stream_url
            errors.append("yt-dlp returned no playable stream URL.")

        self.last_error = " | ".join(errors) if errors else "yt-dlp could not resolve this URL."
        return None

    def start_stream(self, url):
        """Connect to a stream URL."""
        self.is_running = True
        source_url = url
        candidates = []
        try:
            if not source_url:
                self.last_error = "No stream URL provided."
                self.is_running = False
                return False

            if source_url.endswith(".m3u8"):
                candidates.append(source_url)

            if STREAMLINK_AVAILABLE:
                try:
                    streams = streamlink.streams(source_url)
                    if streams:
                        stream_dict = streams.get("720p") or streams.get("best")
                        if not stream_dict:
                            stream_dict = list(streams.values())[-1]
                        if stream_dict and getattr(stream_dict, "url", None):
                            candidates.append(stream_dict.url)
                except Exception as exc:
                    logger.warning("Streamlink resolution failed: %s", exc)

            ytdlp_stream = self._extract_with_ytdlp(source_url)
            if ytdlp_stream:
                candidates.append(ytdlp_stream)

            if source_url not in candidates:
                candidates.append(source_url)

            unique_candidates = list(dict.fromkeys(candidates))
            backend = getattr(cv2, "CAP_FFMPEG", cv2.CAP_ANY)

            open_errors = []
            for stream_url in unique_candidates:
                if not stream_url:
                    continue

                logger.info("Attempting to open stream source: %s", stream_url)
                cap = cv2.VideoCapture(stream_url, backend)
                if cap.isOpened():
                    self.cap = cap
                    return True

                cap.release()
                open_errors.append(f"OpenCV could not open: {stream_url}")

            if self.last_error:
                open_errors.insert(0, self.last_error)

            self.last_error = " | ".join(open_errors) if open_errors else "No valid stream source found."
            self.is_running = False
            return False
        except Exception as exc:
            self.last_error = f"Error starting stream: {exc}"
            logger.exception("Error starting stream")
            self.is_running = False
            return False

    def get_next_frame(self):
        """Yield a frame simulating an intercepted video frame at the target FPS."""
        if not self.is_running or not self.cap:
            return None
            
        ret, frame = self.cap.read()
        if ret:
            # Sleep to pace the frames for downstream analysis avoiding overload
            time.sleep(1.0 / self.fps)
            return frame
        return None
    
    def stop_stream(self):
        self.is_running = False
        if self.cap:
            self.cap.release()
            self.cap = None

# --- WebRTC Extensions ---
try:
    from av import VideoFrame, AudioFrame
    import pydub
    from collections import deque
    WEBRTC_AVAILABLE = True
except ImportError:
    WEBRTC_AVAILABLE = False

if WEBRTC_AVAILABLE:
    class WebRTCVideoProcessor:
        def __init__(self):
            # Keep a buffer of recent frames to analyze sequentially without blocking the stream
            self.frame_buffer = deque(maxlen=5)

        def recv(self, frame: VideoFrame) -> VideoFrame:
            img = frame.to_ndarray(format="bgr24")
            # Push frame to buffer to be analyzed asynchronously by Streamlit loop
            self.frame_buffer.append(img)
            return frame # Pass the frame through unaffected for mirroring

    class WebRTCAudioProcessor:
        def __init__(self):
            self.audio_frames = deque(maxlen=50) # Buffer approx 1 second of audio stream
            
        def recv(self, frame: AudioFrame) -> AudioFrame:
            sound = pydub.AudioSegment(
                data=frame.to_ndarray().tobytes(),
                sample_width=frame.format.bytes,
                frame_rate=frame.sample_rate,
                channels=len(frame.layout.channels),
            )
            # Store audio chunk
            self.audio_frames.append(sound)
            return frame

        def get_1_second_chunk(self):
            """Combines buffered audio frames into a single webm/mp3 blob for Vertex AI."""
            if len(self.audio_frames) == 0:
                return None
            
            combined = self.audio_frames[0]
            for i in range(1, len(self.audio_frames)):
                combined += self.audio_frames[i]
                
            exported = combined.export(format="mp3")
            raw_audio = exported.read()
            self.audio_frames.clear() # Clear buffer after extraction
            return raw_audio
