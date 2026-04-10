import { useCallback, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

/**
 * useDetectionSocket — manages Socket.IO connection to the backend
 * for real-time deepfake detection results.
 *
 * Provides:
 *  - socket instance
 *  - connection status
 *  - sendFrame() — send a base64 frame for webcam analysis
 *  - sendWebRTCFrame() — send a frame for WebRTC participant analysis
 *  - startStream() / stopStream() — stream URL analysis
 *  - Latest detection result + log history + timeline data
 */
export default function useDetectionSocket() {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [latestResult, setLatestResult] = useState(null);
  const [logs, setLogs] = useState([]);
  const [timelineData, setTimelineData] = useState([]);
  const [streamStatus, setStreamStatus] = useState(null);
  const [streamSessionId, setStreamSessionId] = useState(null);

  // Connect on mount
  useEffect(() => {
    const socket = io(window.location.origin, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });

    socket.on('connect', () => {
      setConnected(true);
      addLog('info', 'Connected to Aegis Sentinel server.');
    });

    socket.on('disconnect', () => {
      setConnected(false);
      addLog('warning', 'Disconnected from server.');
    });

    socket.on('connect_error', (err) => {
      addLog('error', `Connection error: ${err.message}`);
    });

    // Detection results (webcam & webrtc)
    socket.on('detection_result', (data) => {
      if (data.error) {
        addLog('error', `Detection error: ${data.error}`);
        return;
      }
      setLatestResult(data);
      addTimelinePoint(data);
      addLog(
        data.status === 'FAKE' ? 'danger' : data.status === 'SUSPICIOUS' ? 'warning' : 'info',
        `[${data.engine || 'unknown'}] Score: ${data.risk_score}% — ${data.status}`,
      );

      // Add artifact details
      if (data.artifacts?.length > 0) {
        data.artifacts.forEach((a) => addLog('warning', `  └─ ${a}`));
      }
    });

    // Stream frame results
    socket.on('stream_frame_result', (data) => {
      setLatestResult(data);
      addTimelinePoint(data);
      addLog(
        data.status === 'FAKE' ? 'danger' : data.status === 'SUSPICIOUS' ? 'warning' : 'info',
        `[Stream #${data.frame_number}] Score: ${data.risk_score}% — ${data.status}`,
      );
    });

    // Stream status updates
    socket.on('stream_status', (data) => {
      setStreamStatus(data);
      const level = data.status === 'error' ? 'error' : 'info';
      addLog(level, `Stream: ${data.message}`);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Log management ──
  const addLog = useCallback((level, text) => {
    setLogs((prev) => {
      const entry = {
        id: Date.now() + Math.random(),
        level,
        text,
        time: new Date().toLocaleTimeString(),
      };
      const updated = [...prev, entry];
      return updated.slice(-100); // Keep last 100 logs
    });
  }, []);

  // ── Timeline data ──
  const addTimelinePoint = useCallback((data) => {
    setTimelineData((prev) => {
      const point = {
        time: new Date().toLocaleTimeString(),
        score: data.risk_score,
        timestamp: Date.now(),
      };
      const updated = [...prev, point];
      return updated.slice(-60); // Keep last 60 points
    });
  }, []);

  // ── Send webcam frame ──
  const sendFrame = useCallback((base64Frame) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('analyze_webcam_frame', { frame: base64Frame });
    }
  }, []);

  // ── Send WebRTC participant frame ──
  const sendWebRTCFrame = useCallback((base64Frame, participantSid) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('analyze_webrtc_frame', {
        frame: base64Frame,
        participant_sid: participantSid,
      });
    }
  }, []);

  // ── Start stream analysis ──
  const startStream = useCallback(async (url) => {
    const sid = socketRef.current?.id;
    try {
      const res = await fetch('/analyze-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, sid }),
      });
      const data = await res.json();
      if (data.session_id) {
        setStreamSessionId(data.session_id);
        addLog('info', `Stream analysis started (session: ${data.session_id})`);
      }
      return data;
    } catch (err) {
      addLog('error', `Failed to start stream: ${err.message}`);
      return null;
    }
  }, [addLog]);

  // ── Stop stream ──
  const stopStream = useCallback(async () => {
    if (!streamSessionId) return;
    try {
      await fetch('/stop-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: streamSessionId }),
      });
      setStreamSessionId(null);
      addLog('info', 'Stream analysis stopped.');
    } catch (err) {
      addLog('error', `Failed to stop stream: ${err.message}`);
    }
  }, [streamSessionId, addLog]);

  // ── Clear data ──
  const clearData = useCallback(() => {
    setLatestResult(null);
    setLogs([]);
    setTimelineData([]);
    setStreamStatus(null);
  }, []);

  return {
    socket: socketRef.current,
    connected,
    latestResult,
    logs,
    timelineData,
    streamStatus,
    streamSessionId,
    sendFrame,
    sendWebRTCFrame,
    startStream,
    stopStream,
    clearData,
    addLog,
  };
}
