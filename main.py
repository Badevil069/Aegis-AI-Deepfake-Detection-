import os
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Import Engines
from engines.analyzer import DetectionLogic
from engines.auditor import DocumentAuditor

load_dotenv()

app = FastAPI(title="Aegis-AI Deepfake Overseer")

# Allow CORS for React Frontend (usually running on port 5173 for Vite)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "*"], # Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize engines
try:
    detector = DetectionLogic()
    auditor = DocumentAuditor()
except Exception as e:
    print(f"Failed to initialize AI engines: {e}")

@app.get("/")
def read_root():
    return {"status": "Aegis-AI Secure Link Established."}

@app.post("/api/analyze")
async def analyze_evidence(file: UploadFile = File(...)):
    """
    Unified endpoint for scanning an uploaded file.
    If it's an image, it runs Gemini visual forensics AND Cloud Vision audits.
    """
    try:
        contents = await file.read()
        filename = file.filename
        
        is_image = filename.lower().endswith(('.png', '.jpg', '.jpeg'))
        
        # 1. Cloud Vision Document Audit
        doc_result = auditor.audit_document(contents, filename)
        
        # 2. Gemini Deepfake Image Scan (if applicable)
        img_result = {"is_deepfake": False, "confidence": 0.0, "details": ["Not a supported image format for deepfake scan."]}
        if is_image:
            img_result = detector.analyze_static_image(contents)
            
        final_risk = "SAFE"
        if doc_result["is_tampered"] or img_result["is_deepfake"]:
            final_risk = "DANGER: HIGH PROBABILITY OF FRAUD/MANIPULATION"
            
        return {
            "status": "success",
            "filename": filename,
            "risk_assessment": final_risk,
            "cloud_vision_audit": doc_result,
            "gemini_visual_scan": img_result
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
