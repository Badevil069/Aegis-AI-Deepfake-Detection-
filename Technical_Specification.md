# Aura Aegis: Technical Specification

## Overview
Aura Aegis is a high-fidelity Deepfake and Digital Fraud Detection platform designed to intercept video streams and analyze documents in real-time. It leverages Google Cloud infrastructure and advanced AI models (Gemini 1.5 Pro) to detect synthetic artifacts and tampering.

## 1. Core Infrastructure (Google Cloud)
*   **Compute:** Google Cloud Run (Serverless Python Backend). Will utilize the "Always Free" tier (2 million requests/month, 360k GB-seconds) to keep operational costs down.
*   **AI Engine:** Vertex AI running **Gemini 1.5 Pro** for multimodal analysis (image, text, and video frames).
*   **Messaging Pipeline:** Google Cloud Pub/Sub for handling real-time data packets from live video streams asynchronously. Includes a lightweight broker to manage stream chunks.

## 2. Functional Engines
*   **Live Stream Interceptor:**
    *   **Technologies:** `streamlink` (URL resolution) and `OpenCV` (cv2).
    *   **Functionality:** Connects to YouTube/Twitch streams, decodes video, and subsamples frames at 5 FPS to balance analysis fidelity and cost/performance.
*   **Detection Logic:**
    *   **Biometric Verification:** `DeepFace` library for initial liveness checks and facial recognition baseline.
    *   **Deepfake Analysis:** Gemini 1.5 Pro analyzes frames for "synthetic artifacts" (e.g., lighting mismatches, inconsistent shadows, temporal anomalies).
*   **Document Auditor:**
    *   **Technology:** Google Cloud Vision API.
    *   **Functionality:** Processes uploaded PDF or JPG invoices to perform OCR, verify metadata, and highlight potential signs of digital tampering or forgery.

## 3. Fantasy-Cyber UI
*   **Framework:** Streamlit for rapid Python-based UI development, heavily customized with injected CSS.
*   **Aesthetics (Glassmorphism):**
    *   **Background:** Deep obsidian / dark mode.
    *   **Accents:** Glowing neon accents indicating statuses: Cyan (Safety), Violet (Caution), Magma (Fraud/Danger).
    *   **Style:** Translucent panels with backdrop filters to create a frosted glass effect.
*   **Real-Time HUD ("The Oracle"):**
    *   A circular central viewport component within the Streamlit layout.
    *   Uses CSS animations (pulsing, glowing) to simulate bioluminescent feedback during active scans.
*   **Live Terminal:**
    *   A simulated or real-time log streaming panel showing the backend pipeline's execution steps ("AI's thought process").

## 4. Deployment Pipeline
1.  Initialize standard Python environment (`requirements.txt`).
2.  Set up Google Cloud Service Account and authenticate locally.
3.  Deploy Streamlit application container to Cloud Run using `gcloud run deploy`.
