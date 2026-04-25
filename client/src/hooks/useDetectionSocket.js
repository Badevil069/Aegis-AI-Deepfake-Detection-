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

  // ── Ingest live-call websocket result ──
  const ingestLiveCallResult = useCallback((data) => {
    if (!data) return;
    if (data.error) {
      addLog('error', `Live Call error: ${data.error}`);
      return;
    }

    const riskScore = Math.round((Number(data.fake_score) || 0) * 100);
    const mappedResult = {
      risk_score: riskScore,
      status: data.status || (riskScore >= 80 ? 'FAKE' : riskScore >= 50 ? 'SUSPICIOUS' : 'REAL'),
      face_count: Number(data.faces) || 0,
      processing_time_ms: Number(data.latency) || 0,
      engine: data.engine || 'live_call',
      room: data.room,
      user: data.user,
    };

    setLatestResult(mappedResult);
    addTimelinePoint(mappedResult);
    addLog(
      mappedResult.status === 'FAKE' ? 'danger' : mappedResult.status === 'SUSPICIOUS' ? 'warning' : 'info',
      `[Live Call] ${mappedResult.user || 'participant'}: ${mappedResult.risk_score}% — ${mappedResult.status} (faces: ${mappedResult.face_count}, ${mappedResult.processing_time_ms}ms)`,
    );

    if (mappedResult.risk_score > 80) {
      addLog('danger', 'Possible Deepfake Detected');
    }
  }, [addLog, addTimelinePoint]);

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

  const wsRef = useRef(null);

  // ── Start stream analysis ──
  const startStream = useCallback(async (url) => {
    try {
      setLatestResult(null);
      setLogs([]);
      setTimelineData([]);
      setStreamStatus({ status: 'resolving', message: 'Connecting to server...' });

      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }

      // 1. Establish WebSocket connection
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/live`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        addLog('info', 'WebSocket connected for live stream.');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.status_msg) {
            const status = data.status_msg.toLowerCase();
            setStreamStatus({ status, message: data.message || '' });
            const level = data.status_msg === 'Error' ? 'error' : 'info';
            addLog(level, `Stream: ${data.status_msg} ${data.message ? '- ' + data.message : ''}`);

            if (status === 'error' || status === 'stopped') {
              setStreamSessionId(null);
            }
            return;
          }

          if (data.fake_score !== undefined) {
            // Map websocket data to UI format
            const mappedResult = {
              risk_score: Math.round(data.fake_score * 100),
              status: data.status,
              face_count: data.faces,
              processing_time_ms: data.latency,
              engine: 'vertex_ai_stream',
              frame_number: data.frames_processed
            };
            
            setLatestResult(mappedResult);
            
            setTimelineData((prev) => {
              const point = {
                time: new Date().toLocaleTimeString(),
                score: mappedResult.risk_score,
                timestamp: Date.now(),
              };
              const updated = [...prev, point];
              return updated.slice(-50); // Maintain last 30-50 points as requested
            });
            
            addLog(
              mappedResult.status === 'FAKE' ? 'danger' : mappedResult.status === 'SUSPICIOUS' ? 'warning' : 'info',
              `[Stream #${data.frames_processed}] Score: ${mappedResult.risk_score}% — ${mappedResult.status}`
            );
          }
        } catch (e) {
          console.error('WebSocket parse error', e);
        }
      };

      ws.onerror = () => addLog('error', 'WebSocket error occurred.');
      ws.onclose = () => addLog('warning', 'WebSocket closed.');

      // 2. Call start-detection endpoint
      const response = await fetch('/start-detection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await response.json();
      
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
      await fetch('/stop-detection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: streamSessionId }),
      });
      
      // Save the final result to historical dashboard
      setLatestResult((currentResult) => {
        setTimelineData((currentTimeline) => {
          if (currentResult) {
            import('../utils/history').then(({ saveDetectionResult }) => {
              saveDetectionResult({
                id: `live-${streamSessionId || Date.now()}`,
                mode: 'live',
                source: 'stream',
                filename: 'Live Stream Session',
                score: currentResult.risk_score || 0,
                label: currentResult.status || 'Real',
                confidence: 85,
                summary: `Live stream analysis completed with final risk score of ${currentResult.risk_score}%.`,
                insights: currentResult.artifacts ? currentResult.artifacts.map((art, i) => ({
                  id: `live-art-${i}`,
                  title: art,
                  severity: currentResult.risk_score >= 70 ? 'High' : 'Medium',
                  confidence: 90
                })) : [{
                  id: 'live-art-0',
                  title: 'No significant anomalies recorded at the time of session end.',
                  severity: 'Low',
                  confidence: 95
                }],
                timeline: currentTimeline.map((p) => p.score),
                generatedAt: new Date().toISOString()
              });
            });
          }
          return currentTimeline;
        });
        return currentResult;
      });

      setStreamSessionId(null);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      addLog('info', 'Stream analysis stopped. Result saved to Dashboard.');
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

  // ── Manual Update (For External WebSockets) ──
  const updateLatestResult = useCallback((data) => {
    setLatestResult(data);
    addTimelinePoint(data);
    addLog(
      data.status === 'FAKE' ? 'danger' : data.status === 'SUSPICIOUS' ? 'warning' : 'info',
      `[Screen Capture] Score: ${data.risk_score}% — ${data.status}`,
    );
  }, [addTimelinePoint, addLog]);

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
    ingestLiveCallResult,
    startStream,
    stopStream,
    clearData,
    addLog,
    updateLatestResult,
  };
}
