# Aura Aegis: Agent Definitions

This document outlines the roles and responsibilities of the specialized agents involved in building the Aura Aegis platform.

## 1. Security Architect Agent

**Role:** The mastermind behind the backend logic, cloud infrastructure, and AI integration.

**Responsibilities:**
*   **Infrastructure:** Provisioning and configuring the Google Cloud Run environment securely using the "Always Free" tier.
*   **Pipeline Development:** Building the Pub/Sub messaging pipeline to handle live video stream data packets over async queues.
*   **AI Integration:** Connecting the backend to Vertex AI (Gemini 1.5 Pro) for advanced deepfake detection and synthetic artifact analysis.
*   **Liveness Hooks:** Integrating the `deepface` library and OpenCV/Streamlink logic to capture, process, and analyze frames at 5 FPS.
*   **Document Auditing:** Implementing the Cloud Vision API workflow for extracting metadata and verifying the integrity of uploaded PDFs and images.
*   **Security:** Ensuring that the stream processing and data transmission are secure and optimized.

## 2. Frontend Enchanter Agent

**Role:** The creative force responsible for designing the "Fantasy-Cyber" UI and orchestrating the visual user experience.

**Responsibilities:**
*   **UI Framework:** Building the frontend interface using Streamlit.
*   **Aesthetics:** Crafting the "Glassmorphism" visual theme via custom CSS injection (deep obsidian background, frosted glass panels, and glowing neon accents).
*   **Color Syntax:** Applying the custom color palette (Cyan for safety, Violet for caution, Magma for fraud) dynamically based on backend analysis results.
*   **The Oracle:** Developing the real-time HUD with smooth CSS/SVG animations that pulse bioluminescently during live analysis scans.
*   **Live Terminal:** Constructing the streaming log console that visually represents the AI's "thought process" with a hacking/cyber dashboard feel.
*   **Responsiveness:** Ensuring the Streamlit application maintains visual fidelity across different screen sizes.
