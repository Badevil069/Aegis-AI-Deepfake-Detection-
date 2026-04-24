# Aura Aegis — Sentinel Platform

<div align="center">
  <h3>Next-Generation Real-Time Deepfake and Digital Fraud Detection</h3>
</div>

**Aura Aegis** is a high-fidelity, hybrid real-time deepfake and digital fraud detection platform. Designed with a striking "Fantasy-Cyber" / Glassmorphism aesthetic, Aegis intercepts live video streams, analyzes physical documents, and performs real-time biometric and synthetic artifact scanning using a combination of deterministic computer vision and cutting-edge Cloud AI.

---

## 🚀 Key Features

*   **Live Stream & Webcam Interception:** Connect directly to user webcams via WebRTC or intercept live streaming video feeds (YouTube, Twitch) via URL. 
*   **Dual-Engine Detection Architecture:**
    *   **Cloud AI Primary Engine:** Leverages Google Vertex AI (Gemini 1.5 Pro) for advanced multimodal analysis to detect subtle synthetic artifacts, lighting inconsistencies, and temporal anomalies.
    *   **Deterministic Fallback (OpenCV & DeepFace):** Ensures the platform remains operational offline or when cloud API limits are reached, providing structural facial tracking and basic liveness checks.
*   **Document Auditing:** Uses Google Cloud Vision API to perform OCR and metadata verification on uploaded documents (PDFs, JPGs) to detect manipulation and forgery.
*   **Reactive Cyber-Aesthetic Dashboard:** A premium React frontend utilizing Framer Motion and custom CSS (glassmorphism, bioluminescent scanning indicators) for a cinematic user experience.
*   **Live Terminal Telemetry:** Streams real-time processing logs directly to the UI, giving users visibility into the AI's "thought process."

---

## 🛠️ Technology Stack

| Component | Technologies |
| :--- | :--- |
| **Backend & APIs** | FastAPI, Python 3, Socket.IO, Uvicorn, yt-dlp, FFmpeg |
| **AI & Computer Vision** | OpenCV (`cv2`), `deepface`, Google Vertex AI (Gemini 1.5 Pro), Google Cloud Vision |
| **Frontend** | React 19, Vite, Tailwind CSS, Framer Motion, Recharts, Socket.IO Client |
| **Infrastructure** | Google Cloud Run (Serverless) |

---

## ⚙️ Prerequisites

Before you begin, ensure you have the following installed:

*   **Python 3.10+**
*   **Node.js 18+** & **npm**
*   **FFmpeg** (Must be installed and added to your system's PATH for stream processing)
*   **Google Cloud CLI** (`gcloud`) (If utilizing Vertex AI features)

---

## 📦 Setup & Installation

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/aegis-ai-deepfake.git
cd aegis-ai-deepfake
```

### 2. Backend Setup
```bash
# Create and activate a virtual environment
python -m venv .venv
# On Mac/Linux:
source .venv/bin/activate
# On Windows:
.venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt

# Environment Variables
# Copy the template and fill in your details (especially Google Cloud credentials if needed)
cp .env.template .env
```

### 3. Frontend Setup
```bash
cd client
npm install
```

---

## 🚦 Running the Platform

To run the application locally, you will need to start both the Python backend and the React development server.

### Start the Backend Server (FastAPI + Socket.IO)
Open a terminal in the root directory:
```bash
# Ensure venv is active
python server.py
# The server will start on http://localhost:8001
```

### Start the Frontend Client (Vite)
Open a separate terminal in the `client` directory:
```bash
cd client
npm run dev
# The client will be available at http://localhost:5173 (or default Vite port)
```

---

## 📖 Usage

1. Open the frontend URL in your browser.
2. **Dashboard / Intelligence Briefing:** Navigate the cinematic UI to review system health and statistics.
3. **Live Analysis (The Command Hub):** 
    *   **Webcam:** Authorize camera access to begin real-time face tracking and deepfake analysis.
    *   **Stream URL:** Paste a Twitch or YouTube link to extract frames dynamically and analyze them via the backend pipeline.
4. **Document Scan:** Upload suspect documents to cross-reference integrity using the Vision API toolset.

---

## 🔒 Architecture Note
This project utilizes a serverless-friendly micro-architecture designed to be deployed to **Google Cloud Run**, keeping operational costs to a minimum ("Always Free" tier). Secure WebSocket communication (Socket.IO) powers the low-latency frame bridging between the client interface and the compute engines.
