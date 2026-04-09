import cv2
import streamlink
import time
import numpy as np

class LiveStreamInterceptor:
    def __init__(self, fps=5):
        self.fps = fps
        self.is_running = False
        self.cap = None

    def start_stream(self, url):
        """Connect to a stream URL using Streamlink."""
        self.is_running = True
        try:
            # Resolve the underlying video stream URL
            streams = streamlink.streams(url)
            if not streams:
                # If it's a direct mp4 or m3u8, try opening it directly as a fallback
                self.cap = cv2.VideoCapture(url)
            else:
                stream_dict = streams.get("720p", streams.get("best"))
                if not stream_dict:
                     stream_dict = list(streams.values())[-1]
                self.cap = cv2.VideoCapture(stream_dict.url)
            
            if not self.cap.isOpened():
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
