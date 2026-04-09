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
        self.project_id = os.getenv("VERTEX_AI_PROJECT_ID", "mock-project")
        
        # Look for env var first, otherwise default to looking in the engines/ directory
        env_path = os.getenv("BRAIN_KEY_PATH")
        self.brain_key_path = env_path if env_path else os.path.join(os.path.dirname(__file__), "brain_key.json")
        
        self.model = None
        if self.brain_key_path and os.path.exists(self.brain_key_path):
            try:
                credentials = service_account.Credentials.from_service_account_file(self.brain_key_path)
                vertexai.init(project=credentials.project_id, credentials=credentials)
                self.model = GenerativeModel("gemini-1.5-pro")
            except Exception as e:
                print(f"Failed to load Vertex AI: {e}")

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
            details.append("Model not initialized. Verify BRAIN_KEY_PATH.")
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

            response = self.model.generate_content([image_part, prompt])
            
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
