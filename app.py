import os
import time
import cv2
import streamlit as st
from dotenv import load_dotenv

# Load Environment Variables from .env securely
load_dotenv()

# Import our modular UI components and engines
from frontend.components import render_oracle_hud, render_terminal
from engines.interceptor import LiveStreamInterceptor
from engines.analyzer import DetectionLogic
from engines.auditor import DocumentAuditor

# Basic setup
st.set_page_config(page_title="Aura Aegis", page_icon="🛡️", layout="wide")

# Read and inject style.css
with open("frontend/style.css", "r") as f:
    css = f"<style>{f.read()}</style>"
st.markdown(css, unsafe_allow_html=True)

# Application Header
st.markdown("<h1 style='text-align: center;'><span class='glow-cyan'>Aura</span> <span class='glow-violet'>Aegis</span></h1>", unsafe_allow_html=True)
st.markdown("<p style='text-align: center;'>High-Fidelity Deepfake & Digital Fraud Detection</p>", unsafe_allow_html=True)

# Routing Tabs
tab1, tab2 = st.tabs(["🎥 Live Stream Interceptor", "📄 Document Auditor"])

# ----- TAB 1: Live Stream Interceptor -----
with tab1:
    st.markdown("### Intercept & Analyze Stream")
    
    col1, col2 = st.columns([2, 1])
    with col1:
        # Provide a default list of known test streams/videos for the hackathon
        demo_urls = [
            "https://www.youtube.com/watch?v=dQw4w9WgXcQ", # Fallback clear stream
            "https://www.youtube.com/watch?v=b2cvB3hH-qA", # Demo video placeholder
        ]
        
        st.markdown("**(Optional) Select a pre-recorded stream for offline demonstrations:**")
        selected_demo = st.selectbox("Demo Streams", ["Custom..."] + demo_urls)
        
        # Determine the target URL
        default_target = selected_demo if selected_demo != "Custom..." else ""
        
        stream_url = st.text_input("Stream URL (YouTube/Twitch)", value=default_target, placeholder="https://youtube.com/watch?v=...")
        start_btn = st.button("Initialize Intercept")
        
        # Placeholder for video stream
        video_placeholder = st.empty()
        
    with col2:
        st.markdown("### The Oracle")
        hud_placeholder = st.empty()
        hud_placeholder.write("Awaiting stream...")
        
        st.markdown("### Live Terminal")
        terminal_placeholder = st.empty()

    if start_btn and stream_url:
        logs = ["Initializing stream connection...", f"Target: {stream_url}"]
        terminal_placeholder.markdown(f'<div class="terminal-log">{"<br>".join(logs)}</div>', unsafe_allow_html=True)
        
        interceptor = LiveStreamInterceptor(fps=2)
        detector = DetectionLogic()
        
        connected = interceptor.start_stream(stream_url)
        if connected:
            for _ in range(10): # Simulate a short live session for demonstration
                frame = interceptor.get_next_frame()
                if frame is not None:
                    # Convert BGR to RGB for Streamlit
                    frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                    video_placeholder.image(frame_rgb, channels="RGB", use_column_width=True)
                    
                    logs.append("Frame intercepted. Running Vertex AI & DeepFace models...")
                    terminal_placeholder.markdown(f'<div class="terminal-log">{"<br>".join(logs)}</div>', unsafe_allow_html=True)
                    
                    # Analyze frame
                    analysis = detector.analyze_frame(frame)
                    
                    status = "safe"
                    if analysis["confidence"] > 0.8 and analysis["is_deepfake"]:
                        status = "danger"
                        logs.extend([f"<span style='color:red;'>ALERT: DEEPFAKE DETECTED ({analysis['confidence']:.2f})</span>"] + analysis["details"])
                    elif analysis["is_deepfake"]:
                        status = "warning"
                        logs.append(f"<span style='color:orange;'>CAUTION: Suspicious artifacts ({analysis['confidence']:.2f})</span>")
                    else:
                        logs.append(f"Clear. Match: {analysis['biometric_baseline_match']}")
                        
                    # Update UI
                    with hud_placeholder.container():
                        render_oracle_hud(status)
                        
                    # Truncate logs
                    if len(logs) > 15:
                        logs = logs[-15:]
                        
                    render_terminal(logs)

            interceptor.stop_stream()
            logs.append("Session Terminated.")
            render_terminal(logs)

# ----- TAB 2: Document Auditor -----
with tab2:
    st.markdown("### Forgery Detection Engine")
    uploaded_file = st.file_uploader("Upload Evidence (PDF/JPG)", type=['pdf', 'jpg', 'jpeg', 'png'])
    
    if uploaded_file is not None:
        st.info("File uploaded successfully. Initializing Cloud Vision API...")
        
        auditor = DocumentAuditor()
        
        with st.spinner("Analyzing forensics metadata and OCR..."):
            result = auditor.audit_document(uploaded_file.read(), uploaded_file.name)
            
            if result["is_tampered"]:
                st.error("🚨 FRAUD DETECTED: Tampering artifacts found in document.")
                render_oracle_hud("danger")
            else:
                st.success("✅ DOCUMENT VERIFIED: No malicious modifications found.")
                render_oracle_hud("safe")
                
            col_a, col_b = st.columns(2)
            with col_a:
                st.markdown("#### OCR Extraction")
                st.code(result["extracted_text"])
                
            with col_b:
                st.markdown("#### Meta-Analysis")
                st.json(result["metadata"])
                
            st.markdown("#### Audit Trail")
            for detail in result["details"]:
                st.markdown(f"- {detail}")
