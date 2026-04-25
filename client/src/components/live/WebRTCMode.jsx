import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, PhoneOff, MonitorUp, Camera, Check, Copy, Users } from 'lucide-react';

export default function WebRTCMode({ addLog, updateLatestResult, latestResult, timelineData }) {
  const [roomInput, setRoomInput] = useState('');
  const [username, setUsername] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [roomIdDisplay, setRoomIdDisplay] = useState('');
  const [copied, setCopied] = useState(false);
  const [captureSource, setCaptureSource] = useState('screen'); // 'screen' or 'webcam'

  const videoRef = useRef(null);
  const wsRef = useRef(null);
  const captureIntervalRef = useRef(null);
  const streamRef = useRef(null);

  // Generate Room ID
  const generateRoomId = useCallback(() => {
    setRoomInput(`meeting-${Math.random().toString(36).slice(2, 8)}`);
  }, []);

  const startScreenCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false
      });
      setCaptureSource('screen');
      addLog?.('info', 'Screen capture started successfully.');
      return stream;
    } catch (err) {
      addLog?.('warning', 'Screen capture denied or failed. Falling back to webcam.');
      return null;
    }
  };

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
      });
      setCaptureSource('webcam');
      addLog?.('info', 'Webcam capture started successfully.');
      return stream;
    } catch (err) {
      addLog?.('error', 'Webcam capture failed. No video source available.');
      return null;
    }
  };

  const stopDetection = useCallback(() => {
    setIsRunning(false);
    
    // Save to history before clearing
    if (latestResult) {
      import('../../utils/history').then(({ saveDetectionResult }) => {
        saveDetectionResult({
          id: `live-call-${roomIdDisplay || Date.now()}`,
          mode: 'live',
          source: captureSource === 'screen' ? 'screen' : 'webcam',
          filename: `Live Call: ${roomIdDisplay}`,
          score: latestResult.risk_score || 0,
          label: latestResult.status || 'Real',
          confidence: 85,
          summary: `Live call analysis completed with final risk score of ${latestResult.risk_score}%.`,
          insights: latestResult.artifacts ? latestResult.artifacts.map((art, i) => ({
            id: `call-art-${i}`,
            title: art,
            severity: latestResult.risk_score >= 70 ? 'High' : 'Medium',
            confidence: 90
          })) : [{
            id: 'call-art-0',
            title: 'No significant anomalies recorded at the time of session end.',
            severity: 'Low',
            confidence: 95
          }],
          timeline: timelineData ? timelineData.map(p => p.score) : [],
          generatedAt: new Date().toISOString()
        });
      });
    }

    if (captureIntervalRef.current) {
      clearInterval(captureIntervalRef.current);
      captureIntervalRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    addLog?.('info', 'Live Call detection stopped. Results saved to Dashboard.');
  }, [addLog, latestResult, timelineData, roomIdDisplay, captureSource]);

  const startDetection = useCallback(async () => {
    const room = roomInput.trim() || `meeting-${Math.random().toString(36).slice(2, 8)}`;
    const name = username.trim() || `Analyst-${Math.random().toString(36).slice(2, 5)}`;
    
    setRoomIdDisplay(room);
    setIsRunning(true);
    addLog?.('info', `Joining Live Call room "${room}" as "${name}"...`);

    let stream = await startScreenCapture();
    if (!stream) {
      stream = await startWebcam();
    }
    
    if (!stream) {
      setIsRunning(false);
      return;
    }
    
    streamRef.current = stream;
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(e => console.error("Video play failed:", e));
    }
    
    // Connect to WebSocket
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/live-call`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      addLog?.('info', 'Connected to Live Call detection server.');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Transform for useDetectionSocket format
        updateLatestResult({
          risk_score: Math.round(data.fake_score * 100),
          status: data.status,
          face_count: data.faces,
          processing_time_ms: data.latency,
          engine: 'live_call_socket',
          artifacts: data.artifacts || []
        });

        if (data.fake_score > 0.8) {
          addLog?.('danger', '⚠️ Possible Deepfake Detected');
        }

      } catch (err) {
        console.error('Failed to parse WebSocket message', err);
      }
    };

    ws.onerror = () => {
      addLog?.('error', 'WebSocket error occurred during Live Call.');
    };

    ws.onclose = () => {
      addLog?.('warning', 'Live Call detection server connection closed.');
      if (isRunning) stopDetection();
    };

    // Frame capture loop
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    captureIntervalRef.current = setInterval(() => {
      if (!videoRef.current || videoRef.current.readyState < 2) return;
      if (ws.readyState !== WebSocket.OPEN) return;
      
      canvas.width = 320;
      canvas.height = 240;
      ctx.drawImage(videoRef.current, 0, 0, 320, 240);
      
      const image = canvas.toDataURL("image/jpeg", 0.6);
      
      ws.send(JSON.stringify({
        type: "frame",
        image: image,
        room: room,
        user: name
      }));
    }, 2000); // Capture every 2 seconds

    // Handle stream end (user clicks Stop Sharing)
    stream.getVideoTracks()[0].onended = () => {
      stopDetection();
    };
  }, [roomInput, username, stopDetection, addLog, updateLatestResult]);

  const videoCallbackRef = useCallback((node) => {
    if (node) {
      videoRef.current = node;
      if (streamRef.current && node.srcObject !== streamRef.current) {
        node.srcObject = streamRef.current;
        node.play().catch(e => console.error("Video play failed:", e));
      }
    }
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (captureIntervalRef.current) clearInterval(captureIntervalRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  const copyRoomId = useCallback(() => {
    navigator.clipboard.writeText(roomIdDisplay).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [roomIdDisplay]);

  if (!isRunning) {
    return (
      <div className="space-y-3">
        <div className="glass-card-elevated p-6">
          <div className="flex items-center gap-2 mb-5">
            <Users className="h-5 w-5 text-brand-cyan/70" />
            <h3 className="text-lg font-semibold text-white">Join Live Call Room</h3>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-[10px] font-medium uppercase tracking-wider text-slate-500 mb-1.5">Your Name</label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Analyst name"
                className="cyber-input"
              />
            </div>

            <div>
              <label className="block text-[10px] font-medium uppercase tracking-wider text-slate-500 mb-1.5">Room ID</label>
              <div className="flex gap-2">
                <input
                  value={roomInput}
                  onChange={(e) => setRoomInput(e.target.value)}
                  placeholder="Enter or generate room ID"
                  className="cyber-input flex-1"
                />
                <button onClick={generateRoomId} className="ghost-button px-3 py-2 text-xs">
                  Generate
                </button>
              </div>
            </div>

            <button
              onClick={startDetection}
              className="cyber-button w-full inline-flex items-center justify-center gap-2 py-3 text-sm font-semibold mt-2"
            >
              <MonitorUp className="h-4 w-4" />
              Capture Screen & Detect
            </button>
          </div>

          <p className="mt-4 text-[10px] text-slate-600 text-center">
            Choose the specific window (e.g. Zoom, Google Meet) when prompted. Falls back to webcam if denied.
          </p>
        </div>
      </div>
    );
  }

  // ── In-room view ──
  return (
    <div className="space-y-3">
      {/* Room header */}
      <div className="glass-card flex items-center justify-between px-4 py-2.5">
        <div className="flex items-center gap-3">
          <div className="cyber-badge cyber-badge-glow text-[10px]">
            <Users className="h-3 w-3" />
            Room: {roomIdDisplay}
          </div>
          <button onClick={copyRoomId} className="inline-flex items-center gap-1 text-[10px] text-slate-500 transition hover:text-brand-cyan">
            {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
            {copied ? 'Copied!' : 'Copy ID'}
          </button>
        </div>
        <span className="text-[10px] text-slate-500">
          Source: {captureSource === 'screen' ? 'Screen Share' : 'Webcam'}
        </span>
      </div>

      {/* Video feed */}
      <div className="glass-card relative overflow-hidden p-2 border-brand-cyan/20 bg-brand-cyan/5">
        <div className="relative aspect-video overflow-hidden rounded-xl bg-black">
          <video
            ref={videoCallbackRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full object-contain"
          />
          {/* Overlay info */}
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
            <span className="rounded-lg bg-black/60 backdrop-blur-sm px-2 py-1 text-[10px] text-white">
              {username || 'You'} ({captureSource})
            </span>
            {latestResult && (
              <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium
                ${latestResult.status === 'FAKE' ? 'text-rose-300 border-rose-400/30 bg-rose-400/10' :
                  latestResult.status === 'SUSPICIOUS' ? 'text-amber-300 border-amber-400/30 bg-amber-400/10' :
                  'text-emerald-300 border-emerald-400/30 bg-emerald-400/10'}
              `}>
                {latestResult.risk_score}% — {latestResult.status}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Leave button */}
      <div className="glass-card flex items-center justify-center py-3">
        <button
          onClick={stopDetection}
          className="inline-flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/15 px-6 py-2.5 text-sm font-medium text-rose-300 transition hover:bg-rose-500/25"
        >
          <PhoneOff className="h-4 w-4" />
          Stop & Leave Room
        </button>
      </div>
    </div>
  );
}
