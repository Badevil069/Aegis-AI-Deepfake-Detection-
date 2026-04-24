import cv2
try:
    import streamlink
    STREAMLINK_AVAILABLE = True
except ImportError:
    STREAMLINK_AVAILABLE = False
import time
import numpy as np

class LiveStreamInterceptor:
    def __init__(self, fps=5):
        self.fps = fps
        self.is_running = False
        self.cap = None

    def start_stream(self, url):
        """Connect to a stream URL."""
        import subprocess
        self.is_running = True
        try:
            if "youtube.com" in url or "youtu.be" in url:
                print("Starting extraction...")
                try:
                    result = subprocess.run(
                        ["yt-dlp", "-f", "best", "-g", url],
                        capture_output=True,
                        text=True,
                        timeout=15
                    )
                    if result.returncode != 0:
                        print("yt-dlp error:", result.stderr)
                        return False
                    stream_url = result.stdout.strip()
                except subprocess.TimeoutExpired:
                    print("yt-dlp timeout")
                    return False
            elif url.endswith(".m3u8"):
                stream_url = url
            else:
                # Fallback to streamlink if available
                if STREAMLINK_AVAILABLE:
                    streams = streamlink.streams(url)
                    if not streams:
                        stream_url = url
                    else:
                        stream_dict = streams.get("720p", streams.get("best"))
                        if not stream_dict:
                             stream_dict = list(streams.values())[-1]
                        stream_url = stream_dict.url
                else:
                    stream_url = url
            
            if not stream_url:
                print("Extraction failed: Stream URL is None")
                return False
                
            print("Stream URL:", stream_url)
            print("Opening video stream...")
            self.cap = cv2.VideoCapture(stream_url)
            
            if not self.cap.isOpened():
                print("Failed to open stream")
                return False
                
            return True
        except Exception as e:
            print(f"Error starting stream: {e}")
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
