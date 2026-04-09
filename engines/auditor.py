import os
import time
from google.oauth2 import service_account
from google.cloud import vision

class DocumentAuditor:
    def __init__(self):
        # Look for env var first, otherwise default to looking in the engines/ directory
        env_path = os.getenv("EYES_KEY_PATH")
        self.eyes_key_path = env_path if env_path else os.path.join(os.path.dirname(__file__), "eyes_key.json")
        
        self.client = None
        if self.eyes_key_path and os.path.exists(self.eyes_key_path):
            try:
                credentials = service_account.Credentials.from_service_account_file(self.eyes_key_path)
                self.client = vision.ImageAnnotatorClient(credentials=credentials)
            except Exception as e:
                print(f"Failed to load Cloud Vision API: {e}")

    def audit_document(self, document_bytes, filename):
        """
        Process a document using Google Cloud Vision API for deep inspection.
        """
        if not self.client:
            time.sleep(1.5)
            return {
                "is_tampered": False,
                "filename": filename,
                "extracted_text": "Model not initialized. Verify EYES_KEY_PATH in .env.",
                "metadata_integrity": True,
                "details": ["Unable to run Cloud Vision API without credentials."],
                "metadata": {}
            }

        try:
            image = vision.Image(content=document_bytes)
            
            response = self.client.document_text_detection(image=image)
            safe_search = self.client.safe_search_detection(image=image)
            
            extracted_text = response.full_text_annotation.text if response.full_text_annotation else "No recognizable text."
            
            is_tampered = False
            details = ["Cloud Vision analysis complete."]
            
            if safe_search.safe_search_annotation:
                if safe_search.safe_search_annotation.spoof in [vision.Likelihood.LIKELY, vision.Likelihood.VERY_LIKELY]:
                    is_tampered = True
                    details.append("ALERT: Likely spoof/tampered document detected by Cloud Vision SafeSearch.")
                else:
                    details.append("No spoofing artifacts detected in SafeSearch.")

            if response.error.message:
                raise Exception(response.error.message)

            return {
                "is_tampered": is_tampered,
                "filename": filename,
                "extracted_text": extracted_text[:1000] + ("..." if len(extracted_text) > 1000 else ""),
                "metadata_integrity": not is_tampered,
                "details": details,
                "metadata": {
                    "vision_processing_status": "Success",
                    "blocks_detected": len(response.text_annotations) if response.text_annotations else 0
                }
            }

        except Exception as e:
            return {
                "is_tampered": False,
                "filename": filename,
                "extracted_text": "",
                "metadata_integrity": False,
                "details": [f"Error during Cloud Vision analysis: {e}"],
                "metadata": {}
            }
