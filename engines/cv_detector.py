"""
CV-Based Deepfake Detection Engine (Fallback)
=============================================
Performs REAL image analysis using OpenCV when Vertex AI is unavailable.
No mock/simulated data — every score is computed from actual pixel data.

Analysis pipeline:
1. Face detection (Haar cascade)
2. Blur detection (Laplacian variance)
3. Frequency domain analysis (DCT — GAN artifact detection)
4. Color histogram consistency
5. Facial region symmetry analysis
6. Edge coherence check
"""

import cv2
import numpy as np
import base64
import time


class CVDetector:
    """Deterministic computer-vision-based deepfake detector."""

    def __init__(self):
        # Load Haar cascades for face and eye detection
        self.face_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
        )
        self.eye_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + "haarcascade_eye.xml"
        )

    def decode_base64_frame(self, b64_data: str) -> np.ndarray:
        """Decode a base64-encoded JPEG/PNG image into an OpenCV frame."""
        # Strip data URI prefix if present
        if "," in b64_data:
            b64_data = b64_data.split(",", 1)[1]
        img_bytes = base64.b64decode(b64_data)
        nparr = np.frombuffer(img_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        return frame

    def decode_raw_bytes(self, raw_bytes: bytes) -> np.ndarray:
        """Decode raw image bytes into an OpenCV frame."""
        nparr = np.frombuffer(raw_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        return frame

    def analyze_frame(self, frame: np.ndarray) -> dict:
        """
        Run full CV detection pipeline on a single frame.
        Returns risk_score (0-100), status, and detailed findings.
        """
        if frame is None or frame.size == 0:
            return {
                "risk_score": 0,
                "status": "ERROR",
                "details": ["Invalid or empty frame received."],
                "face_count": 0,
                "artifacts": [],
                "timestamp": time.time(),
            }

        start_time = time.time()
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        h, w = frame.shape[:2]

        # Collect individual risk signals (each 0.0 - 1.0)
        signals = []
        details = []
        artifacts = []

        # ─── 1. FACE DETECTION ───
        faces = self.face_cascade.detectMultiScale(
            gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30)
        )
        face_count = len(faces)

        if face_count == 0:
            details.append("No face detected in frame.")
            signals.append(0.1)  # Low signal — no face to analyze
        else:
            details.append(f"{face_count} face(s) detected.")

        # ─── 2. PER-FACE ANALYSIS ───
        for i, (fx, fy, fw, fh) in enumerate(faces):
            face_roi = frame[fy : fy + fh, fx : fx + fw]
            face_gray = gray[fy : fy + fh, fx : fx + fw]

            # 2a. Blur detection (Laplacian variance)
            blur_score = self._detect_blur(face_gray)
            if blur_score < 50:
                artifacts.append(f"Face {i+1}: Unusual softness/blur (Laplacian={blur_score:.1f})")
                signals.append(0.6)
            elif blur_score < 100:
                artifacts.append(f"Face {i+1}: Moderate blur (Laplacian={blur_score:.1f})")
                signals.append(0.3)
            else:
                signals.append(0.05)

            # 2b. Frequency domain analysis (DCT — GAN artifact detection)
            freq_anomaly = self._dct_analysis(face_gray)
            if freq_anomaly > 0.6:
                artifacts.append(f"Face {i+1}: High-frequency anomaly in DCT spectrum ({freq_anomaly:.2f})")
                signals.append(0.7)
            elif freq_anomaly > 0.35:
                artifacts.append(f"Face {i+1}: Moderate frequency irregularity ({freq_anomaly:.2f})")
                signals.append(0.35)
            else:
                signals.append(0.05)

            # 2c. Facial symmetry analysis
            symmetry_score = self._symmetry_analysis(face_gray)
            if symmetry_score > 0.85:
                artifacts.append(f"Face {i+1}: Unnaturally high symmetry ({symmetry_score:.2f}) — possible synthetic")
                signals.append(0.55)
            elif symmetry_score < 0.4:
                artifacts.append(f"Face {i+1}: Very asymmetric face region ({symmetry_score:.2f})")
                signals.append(0.15)
            else:
                signals.append(0.05)

            # 2d. Eye detection (expecting ~2 eyes per face)
            eyes = self.eye_cascade.detectMultiScale(face_gray)
            if len(eyes) == 0:
                artifacts.append(f"Face {i+1}: No eyes detected — possible occlusion or synthesis artifact")
                signals.append(0.4)
            elif len(eyes) > 4:
                artifacts.append(f"Face {i+1}: Anomalous eye region count ({len(eyes)})")
                signals.append(0.5)
            else:
                signals.append(0.02)

            # 2e. Color histogram consistency
            color_score = self._color_consistency(face_roi, frame)
            if color_score > 0.6:
                artifacts.append(f"Face {i+1}: Color histogram divergence from background ({color_score:.2f})")
                signals.append(0.45)
            else:
                signals.append(0.05)

        # ─── 3. GLOBAL FRAME ANALYSIS ───

        # 3a. Edge coherence across entire frame
        edge_score = self._edge_coherence(gray)
        if edge_score > 0.5:
            artifacts.append(f"Global edge coherence anomaly ({edge_score:.2f})")
            signals.append(0.35)
        else:
            signals.append(0.03)

        # 3b. JPEG compression artifact check
        jpeg_score = self._jpeg_artifact_check(gray)
        if jpeg_score > 0.5:
            artifacts.append(f"Double JPEG compression artifacts detected ({jpeg_score:.2f})")
            signals.append(0.3)
        else:
            signals.append(0.02)

        # ─── AGGREGATE SCORE ───
        if not signals:
            risk_score = 10
        else:
            # Weighted: highest signals matter most
            sorted_signals = sorted(signals, reverse=True)
            # Top 3 signals weighted 3x, rest 1x
            weighted = []
            for j, s in enumerate(sorted_signals):
                weight = 3.0 if j < 3 else 1.0
                weighted.append(s * weight)
            risk_score = (sum(weighted) / (3 * 3 + max(0, len(weighted) - 3))) * 100
            risk_score = min(99, max(1, int(risk_score)))

        # Classify status
        if risk_score >= 70:
            status = "FAKE"
        elif risk_score >= 40:
            status = "SUSPICIOUS"
        else:
            status = "REAL"

        elapsed = time.time() - start_time

        if not artifacts:
            details.append("No significant deepfake artifacts detected.")

        return {
            "risk_score": risk_score,
            "status": status,
            "details": details + artifacts,
            "face_count": face_count,
            "artifacts": artifacts,
            "processing_time_ms": round(elapsed * 1000, 1),
            "timestamp": time.time(),
            "engine": "cv_fallback",
        }

    # ═══════════════════════════════════════════
    #  PRIVATE ANALYSIS METHODS
    # ═══════════════════════════════════════════

    def _detect_blur(self, gray_roi: np.ndarray) -> float:
        """Laplacian variance — lower = blurrier (synthetic faces often overly smooth)."""
        if gray_roi.size == 0:
            return 999.0
        return cv2.Laplacian(gray_roi, cv2.CV_64F).var()

    def _dct_analysis(self, gray_roi: np.ndarray) -> float:
        """
        DCT frequency domain analysis.
        GAN-generated faces often have distinctive high-frequency patterns.
        Returns anomaly score 0.0 - 1.0.
        """
        if gray_roi.size == 0 or min(gray_roi.shape) < 8:
            return 0.0

        # Resize to standard size for consistent analysis
        resized = cv2.resize(gray_roi, (64, 64)).astype(np.float32)
        dct = cv2.dct(resized)

        # Analyze high-frequency components (bottom-right quadrant)
        high_freq = dct[32:, 32:]
        low_freq = dct[:32, :32]

        hf_energy = np.sum(np.abs(high_freq))
        lf_energy = np.sum(np.abs(low_freq)) + 1e-8

        ratio = hf_energy / lf_energy

        # Normalize: natural images typically have ratio 0.01-0.1
        # Synthetic images often 0.15+
        anomaly = min(1.0, max(0.0, (ratio - 0.05) / 0.25))
        return anomaly

    def _symmetry_analysis(self, gray_roi: np.ndarray) -> float:
        """
        Check bilateral symmetry of face region.
        Perfectly symmetric = more likely synthetic.
        Returns similarity score 0.0 - 1.0.
        """
        if gray_roi.size == 0 or gray_roi.shape[1] < 10:
            return 0.5

        h, w = gray_roi.shape
        half = w // 2
        left = gray_roi[:, :half]
        right = cv2.flip(gray_roi[:, w - half :], 1)

        # Ensure same size
        min_h = min(left.shape[0], right.shape[0])
        min_w = min(left.shape[1], right.shape[1])
        left = left[:min_h, :min_w]
        right = right[:min_h, :min_w]

        if left.size == 0:
            return 0.5

        # SSIM-like comparison (simplified)
        diff = cv2.absdiff(left, right)
        similarity = 1.0 - (np.mean(diff) / 255.0)
        return similarity

    def _color_consistency(self, face_roi: np.ndarray, full_frame: np.ndarray) -> float:
        """
        Compare color histogram of face region vs full frame.
        Pasted faces often have different color distributions.
        Returns divergence score 0.0 - 1.0.
        """
        if face_roi.size == 0 or full_frame.size == 0:
            return 0.0

        face_hsv = cv2.cvtColor(face_roi, cv2.COLOR_BGR2HSV)
        frame_hsv = cv2.cvtColor(full_frame, cv2.COLOR_BGR2HSV)

        # Compute hue histograms
        face_hist = cv2.calcHist([face_hsv], [0], None, [30], [0, 180])
        frame_hist = cv2.calcHist([frame_hsv], [0], None, [30], [0, 180])

        cv2.normalize(face_hist, face_hist)
        cv2.normalize(frame_hist, frame_hist)

        # Chi-squared distance
        comparison = cv2.compareHist(face_hist, frame_hist, cv2.HISTCMP_CHISQR)
        # Normalize (typical range 0-5, but can be higher)
        score = min(1.0, comparison / 3.0)
        return score

    def _edge_coherence(self, gray: np.ndarray) -> float:
        """
        Check edge coherence across the frame.
        Composited images often have edge discontinuities.
        Returns anomaly score 0.0 - 1.0.
        """
        if gray.size == 0:
            return 0.0

        edges = cv2.Canny(gray, 50, 150)
        h, w = edges.shape

        # Split into quadrants and compare edge density
        q1 = edges[: h // 2, : w // 2]
        q2 = edges[: h // 2, w // 2 :]
        q3 = edges[h // 2 :, : w // 2]
        q4 = edges[h // 2 :, w // 2 :]

        densities = [np.mean(q) / 255.0 for q in [q1, q2, q3, q4]]
        if max(densities) == 0:
            return 0.0

        variance = np.var(densities)
        # High variance suggests compositing
        score = min(1.0, variance * 20)
        return score

    def _jpeg_artifact_check(self, gray: np.ndarray) -> float:
        """
        Detect double JPEG compression artifacts.
        Re-saved deepfakes often show block boundary artifacts.
        Returns score 0.0 - 1.0.
        """
        if gray.size == 0 or min(gray.shape) < 16:
            return 0.0

        h, w = gray.shape
        # Check 8x8 block boundaries (JPEG block size)
        block_diffs = []
        for y in range(8, min(h, 64), 8):
            row_above = gray[y - 1, :min(w, 64)].astype(np.float32)
            row_at = gray[y, :min(w, 64)].astype(np.float32)
            diff = np.mean(np.abs(row_above - row_at))
            block_diffs.append(diff)

        if not block_diffs:
            return 0.0

        avg_diff = np.mean(block_diffs)
        # Normalize: natural images ~3-8, double-compressed ~10+
        score = min(1.0, max(0.0, (avg_diff - 5) / 10))
        return score
