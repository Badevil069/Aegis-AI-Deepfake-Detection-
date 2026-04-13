import os
import time
import cv2
import json
from google.oauth2 import service_account
import vertexai
from vertexai.generative_models import GenerativeModel, Part

try:
    from deepface import DeepFace
    DEEPFACE_AVAILABLE = True
except ImportError:
    DEEPFACE_AVAILABLE = False

class DetectionLogic:
    def __init__(self):
        self.project_id = os.getenv("VERTEX_AI_PROJECT_ID", "")
        self.location = os.getenv("VERTEX_AI_LOCATION", "us-central1")
        self.model_name = os.getenv("VERTEX_MODEL_NAME", "")
        
        # Look for env var first, otherwise default to looking in the engines/ directory
        env_path = os.getenv("BRAIN_KEY_PATH")
        self.brain_key_path = env_path if env_path else os.path.join(os.path.dirname(__file__), "brain_key.json")
        self.init_error = None
        self.active_model_index = 0
        self.model_candidates = [
            name for name in [
                self.model_name,
                "gemini-2.5-flash",
                "gemini-2.0-flash-001",
                "gemini-2.0-flash",
                "gemini-1.5-flash-002",
                "gemini-1.5-pro-002",
                "gemini-1.5-flash",
                "gemini-1.5-pro",
            ]
            if name
        ]
        
        self.model = None
        if self.brain_key_path and os.path.exists(self.brain_key_path):
            try:
                credentials = service_account.Credentials.from_service_account_file(self.brain_key_path)
                resolved_project = self.project_id or credentials.project_id
                vertexai.init(project=resolved_project, location=self.location, credentials=credentials)

                last_error = None
                for idx, candidate in enumerate(self.model_candidates):
                    try:
                        self.model = GenerativeModel(candidate)
                        self.model_name = candidate
                        self.active_model_index = idx
                        break
                    except Exception as model_error:
                        last_error = model_error

                if not self.model:
                    raise RuntimeError(
                        f"No usable Vertex model found in candidates: {self.model_candidates}. Last error: {last_error}"
                    )
            except Exception as e:
                self.init_error = f"Failed to load Vertex AI: {e}"
                print(self.init_error)
        else:
            self.init_error = f"Credential file not found: {self.brain_key_path}"

    def _is_model_not_found_error(self, error):
        message = str(error).lower()
        return (
            "publisher model" in message
            or "model was not found" in message
            or "404" in message
            or "not have access" in message
        )

    def _switch_to_next_model(self):
        for idx in range(self.active_model_index + 1, len(self.model_candidates)):
            candidate = self.model_candidates[idx]
            try:
                self.model = GenerativeModel(candidate)
                self.model_name = candidate
                self.active_model_index = idx
                return True
            except Exception:
                continue
        return False

    def _generate_with_fallback(self, payload):
        if not self.model:
            raise RuntimeError(self.init_error or "Model not initialized.")

        attempts = 0
        while attempts < len(self.model_candidates):
            try:
                return self.model.generate_content(payload)
            except Exception as error:
                if self._is_model_not_found_error(error) and self._switch_to_next_model():
                    attempts += 1
                    continue
                raise

    def analyze_frame(self, frame):
        """
        Analyze a frame using DeepFace for biometrics and Gemini 1.5 Pro for deepfake artifacts.
        """
        biometric_match = True
        biometrics_error = None
        details = []

        # 1. Biometric check with DeepFace
        if DEEPFACE_AVAILABLE:
            try:
                # We don't have a baseline image, so we just run a facial feature extraction to ensure 
                # a human face exists and is trackable.
                faces = DeepFace.extract_faces(img_path=frame, enforce_detection=False)
                if not faces or len(faces) == 0:
                    details.append("No clear face detected by biometric engine.")
            except Exception as e:
                biometric_match = False
                biometrics_error = str(e)
                details.append(f"Biometric extraction error: {e}")
        else:
            details.append("DeepFace biometric capabilities disabled (missing dependencies).")

        # 2. Deepfake artifact analysis with Gemini
        is_deepfake = False
        confidence = 0.5

        if not self.model:
            details.append(self.init_error or "Model not initialized. Verify BRAIN_KEY_PATH.")
            return {
                "is_deepfake": False,
                "confidence": 0.85,
                "details": details,
                "biometric_baseline_match": biometric_match
            }

        try:
            success, encoded_image = cv2.imencode('.jpg', frame)
            if not success:
               raise ValueError("Could not encode frame")
            
            image_part = Part.from_data(data=encoded_image.tobytes(), mime_type="image/jpeg")

            prompt = (
                "You are an expert deepfake detection AI. Analyze the given video frame. "
                "Look for synthetic artifacts, lighting mismatches, inconsistent shadows, "
                "or temporal anomalies (if inferred). "
                "Return your findings STRICTLY as a JSON object with the following keys: "
                "\"is_deepfake\" (boolean), \"confidence\" (float between 0.0 and 1.0), "
                "\"details\" (list of string descriptions of artifacts found or clear status). "
                "Do not include markdown blocks like ```json."
            )

            response = self._generate_with_fallback([image_part, prompt])
            
            response_text = response.text.strip()
            if response_text.startswith('```json'):
                response_text = response_text.split('```json')[1].split('```')[0].strip()
            elif response_text.startswith('```'):
                response_text = response_text.split('```')[1].strip()

            result = json.loads(response_text)
            is_deepfake = result.get("is_deepfake", False)
            confidence = result.get("confidence", 0.5)
            details.extend(result.get("details", ["Gemini visual analysis complete."]))

        except Exception as e:
            details.append(f"Vertex AI Error: {e}")
            confidence = 0.0

        return {
            "is_deepfake": is_deepfake,
            "confidence": confidence,
            "details": details,
            "biometric_baseline_match": biometric_match
        }

    def analyze_audio(self, raw_audio_data):
        """
        Analyze a raw audio chunk using Gemini 1.5 Pro to detect AI voice cloning.
        """
        if not self.model:
            return {"is_deepfake": False, "confidence": 0.0, "details": ["Model not initialized."]}
            
        try:
            # We assume raw_audio_data is bytes in a valid format (e.g. mp3/wav)
            audio_part = Part.from_data(data=raw_audio_data, mime_type="audio/webm")
            prompt = (
                "You are an expert deepfake audio detection AI. Analyze the given audio snippet. "
                "Look for robotic inflections, unnatural breathing patterns, metallic phasing, "
                "or signs of AI voice cloning. "
                "Return your findings STRICTLY as a JSON object with the following keys: "
                "\"is_deepfake\" (boolean), \"confidence\" (float between 0.0 and 1.0), "
                "\"details\" (list of string findings). Do not include markdown blocks."
            )
            response = self._generate_with_fallback([audio_part, prompt])
            response_text = response.text.strip()
            if response_text.startswith('```json'):
                response_text = response_text.split('```json')[1].split('```')[0].strip()
            elif response_text.startswith('```'):
                response_text = response_text.split('```')[1].strip()

            result = json.loads(response_text)
            return {
                "is_deepfake": result.get("is_deepfake", False),
                "confidence": result.get("confidence", 0.5),
                "details": result.get("details", ["Audio analysis complete."])
            }
        except Exception as e:
            return {"is_deepfake": False, "confidence": 0.0, "details": [f"Voice AI Error: {str(e)}"]}

    def analyze_static_image(self, image_bytes):
        """
        Analyze a static image upload directly for deepfake artifacts using Gemini 1.5 Pro.
        """
        if not self.model:
            return {"is_deepfake": False, "confidence": 0.0, "details": ["Model not initialized."]}
            
        try:
            image_part = Part.from_data(data=image_bytes, mime_type="image/jpeg")
            prompt = (
                "You are a forensic investigator. Check this static image for AI generation "
                "manipulations. Look for six-fingered hands, smudged backgrounds, illogical "
                "geometry, or typical GAN/Midjourney artifacts. "
                "Return your findings STRICTLY as a JSON object with the following keys: "
                "\"is_deepfake\" (boolean), \"confidence\" (float between 0.0 and 1.0), "
                "\"details\" (list of string findings). Do not include markdown."
            )
            response = self._generate_with_fallback([image_part, prompt])
            response_text = response.text.strip()
            if response_text.startswith('```json'):
                response_text = response_text.split('```json')[1].split('```')[0].strip()
            elif response_text.startswith('```'):
                response_text = response_text.split('```')[1].strip()

            result = json.loads(response_text)
            return {
                "is_deepfake": result.get("is_deepfake", False),
                "confidence": result.get("confidence", 0.5),
                "details": result.get("details", ["Static image scan complete."])
            }
        except Exception as e:
            return {"is_deepfake": False, "confidence": 0.0, "details": [f"Visual AI Error: {str(e)}"]}

    def review_document(self, document_bytes, filename, audit_findings=None, document_text=None):
        """
        Run a second-pass review for uploaded documents using Gemini.
        Uses the raw document when supported, otherwise falls back to the extracted text and audit findings.
        """
        if not self.model:
            return {
                "is_deepfake": False,
                "confidence": 0.0,
                "details": [self.init_error or "Model not initialized."],
                "review_mode": "skipped",
            }

        audit_findings = audit_findings or []
        lower_name = (filename or "").lower()
        is_pdf = lower_name.endswith(".pdf") or document_bytes.startswith(b"%PDF")
        is_image = lower_name.endswith((".png", ".jpg", ".jpeg", ".tif", ".tiff", ".bmp"))

        try:
            findings_hint = "; ".join(audit_findings[:8]) if audit_findings else "No prior findings provided."
            extracted_text = (document_text or "").strip()
            payload_hint = extracted_text[:4000] if extracted_text else "No extracted text was provided."
            prompt = (
                "You are a forensic document reviewer. Evaluate the uploaded file for signs of forgery, "
                "tampering, synthetic generation, or inconsistent document structure. "
                "Use this prior audit context: "
                f"{findings_hint}. "
                "Use this extracted text or summary if present: "
                f"{payload_hint}. "
                "Return STRICT JSON with keys: "
                '"is_deepfake" (boolean), "confidence" (float between 0.0 and 1.0), '
                '"details" (list of concise findings). '
                "Do not include markdown or code fences."
            )

            if is_pdf or is_image:
                doc_part = Part.from_data(data=document_bytes, mime_type="application/pdf" if is_pdf else "image/jpeg")
                response = self._generate_with_fallback([doc_part, prompt])
            else:
                response = self._generate_with_fallback(prompt)

            response_text = response.text.strip()
            if response_text.startswith("```json"):
                response_text = response_text.split("```json")[1].split("```")[0].strip()
            elif response_text.startswith("```"):
                response_text = response_text.split("```")[1].strip()

            parsed = json.loads(response_text)
            return {
                "is_deepfake": parsed.get("is_deepfake", False),
                "confidence": parsed.get("confidence", 0.5),
                "details": parsed.get("details", ["Vertex document review complete."]),
                "review_mode": "second_pass",
            }
        except Exception as e:
            return {
                "is_deepfake": False,
                "confidence": 0.0,
                "details": [f"Vertex document review error: {str(e)}"],
                "review_mode": "error",
            }
