import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, AlertTriangle, Check, Copy, Phone, PhoneOff, Users } from 'lucide-react';

/**
 * WebRTCMode — Live Call detection UI.
 * Uses screen capture (primary) or webcam fallback and streams frames over WebSocket.
 */
export default function WebRTCMode({
  socket,
  localStream,
  participants,
  joinRoom,
  leaveRoom,
  addLog,
  ingestLiveCallResult,
}) {
  const [roomInput, setRoomInput] = useState('');
  const [username, setUsername] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [roomIdDisplay, setRoomIdDisplay] = useState('');
  const [copied, setCopied] = useState(false);
  const [participantScores, setParticipantScores] = useState({});
  const [showDeepfakeAlert, setShowDeepfakeAlert] = useState(false);
  const [joinError, setJoinError] = useState('');

  const localVideoRef = useRef(null);
  const remoteVideoRefs = useRef({});
  const captureRef = useRef(null);
  const wsRef = useRef(null);
  const captureStreamRef = useRef(null);
  const alertTimerRef = useRef(null);

  // Attach local stream to video element when not using capture stream
  useEffect(() => {
    if (localVideoRef.current && localStream && !captureStreamRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (captureRef.current) clearInterval(captureRef.current);
      if (alertTimerRef.current) clearTimeout(alertTimerRef.current);
      if (captureStreamRef.current) {
        captureStreamRef.current.getTracks().forEach((track) => track.stop());
        captureStreamRef.current = null;
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, []);

  const getStatusColor = useCallback((status) => {
    if (status === 'FAKE') return 'border-rose-500/30 bg-rose-500/10';
    if (status === 'SUSPICIOUS') return 'border-amber-500/30 bg-amber-500/10';
    return 'border-emerald-500/20 bg-emerald-500/5';
  }, []);

  const getStatusBadge = useCallback((score, status) => {
    const badgeColor = status === 'FAKE'
      ? 'border-rose-400/30 bg-rose-400/10 text-rose-200'
      : status === 'SUSPICIOUS'
        ? 'border-amber-400/30 bg-amber-400/10 text-amber-200'
        : 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200';
    return (
      <span className={`rounded-full border px-2 py-1 text-[10px] font-medium ${badgeColor}`}>
        {score}% {status}
      </span>
    );
  }, []);

  const startScreenCapture = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        await localVideoRef.current.play();
      }
      return stream;
    } catch (err) {
      return null;
    }
  }, []);

  const startWebcam = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        await localVideoRef.current.play();
      }
      return stream;
    } catch (err) {
      return null;
    }
  }, []);

  const stopDetection = useCallback(() => {
    setIsRunning(false);

    if (captureRef.current) {
      clearInterval(captureRef.current);
      captureRef.current = null;
    }

    if (captureStreamRef.current) {
      captureStreamRef.current.getTracks().forEach((track) => track.stop());
      captureStreamRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setParticipantScores({});
    setShowDeepfakeAlert(false);
    leaveRoom();
    addLog?.('info', 'Live call detection stopped.');
  }, [addLog, leaveRoom]);

  const startDetection = useCallback(async (room, name) => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/live-call`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    const stream = (await startScreenCapture()) || (await startWebcam());
    if (!stream) {
      setIsRunning(false);
      addLog?.('error', 'Unable to access screen or webcam for live call detection.');
      return;
    }

    captureStreamRef.current = stream;

    ws.onopen = () => {
      addLog?.('info', 'Live call detection channel connected.');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        ingestLiveCallResult?.(data);

        const riskScore = Math.round((Number(data.fake_score) || 0) * 100);
        setParticipantScores((prev) => ({
          ...prev,
          local: {
            score: riskScore,
            status: data.status || 'REAL',
          },
        }));

        if ((Number(data.fake_score) || 0) > 0.8) {
          setShowDeepfakeAlert(true);
          if (alertTimerRef.current) clearTimeout(alertTimerRef.current);
          alertTimerRef.current = setTimeout(() => setShowDeepfakeAlert(false), 4000);
          addLog?.('danger', 'Possible Deepfake Detected');
        }
      } catch (err) {
        addLog?.('error', 'Live call response parsing failed.');
      }
    };

    ws.onerror = () => {
      addLog?.('error', 'Live call WebSocket error.');
    };

    ws.onclose = () => {
      addLog?.('warning', 'Live call WebSocket closed.');
    };

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    captureRef.current = setInterval(() => {
      if (!localVideoRef.current || localVideoRef.current.readyState < 2) return;
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

      canvas.width = 320;
      canvas.height = 240;
      ctx.drawImage(localVideoRef.current, 0, 0, 320, 240);
      const image = canvas.toDataURL('image/jpeg');

      wsRef.current.send(JSON.stringify({
        type: 'frame',
        image,
        room: room,
        user: name,
      }));
    }, 2000);

    stream.getVideoTracks()[0].onended = () => {
      stopDetection();
    };
  }, [addLog, ingestLiveCallResult, startScreenCapture, startWebcam, stopDetection]);

  // Listen for per-participant detection results (webrtc side)
  useEffect(() => {
    if (!socket) return;

    const handler = (data) => {
      if (data.source === 'webrtc' && data.participant_sid) {
        setParticipantScores((prev) => ({
          ...prev,
          [data.participant_sid]: {
            score: data.risk_score,
            status: data.status,
          },
        }));
      }
    };

    socket.on('detection_result', handler);
    return () => socket.off('detection_result', handler);
  }, [socket]);

  // Generate room ID
  const generateRoomId = useCallback(() => {
    const id = `aegis-${Math.random().toString(36).slice(2, 8)}`;
    setRoomInput(id);
  }, []);

  // Join
  const handleJoin = useCallback(async () => {
    const room = roomInput.trim();
    const name = username.trim();

    if (!name) {
      setJoinError('Name is required.');
      addLog?.('warning', 'Please enter your name before joining.');
      return;
    }

    if (!room) {
      setJoinError('Room ID is required.');
      addLog?.('warning', 'Please enter a room ID before joining.');
      return;
    }

    setJoinError('');
    setRoomIdDisplay(room);
    await joinRoom(room, name);
    setIsRunning(true);
    addLog?.('info', `Joining room "${room}" as "${name}"...`);
    startDetection(room, name);
  }, [roomInput, username, joinRoom, addLog, startDetection]);

  const copyRoomId = useCallback(() => {
    navigator.clipboard.writeText(roomIdDisplay).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      addLog?.('error', 'Unable to copy Room ID to clipboard.');
    });
  }, [addLog, roomIdDisplay]);

  if (!isRunning) {
    return (
      <div className="space-y-3">
        <div className="glass-card-elevated p-6">
          <div className="flex items-center gap-2 mb-5">
            <Users className="h-5 w-5 text-brand-cyan/70" />
            <h3 className="text-lg font-semibold text-white">Join Detection Room</h3>
          </div>

          <div className="space-y-3">
            <div>
              <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-wider text-slate-500">Your Name</label>
              <input
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (joinError) setJoinError('');
                }}
                placeholder="Analyst name"
                className="cyber-input"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-wider text-slate-500">Room ID</label>
              <div className="flex gap-2">
                <input
                  value={roomInput}
                  onChange={(e) => {
                    setRoomInput(e.target.value);
                    if (joinError) setJoinError('');
                  }}
                  placeholder="Enter or generate room ID"
                  className="cyber-input flex-1"
                />
                <button onClick={generateRoomId} className="ghost-button px-3 py-2 text-xs">
                  Generate
                </button>
              </div>
            </div>

            <button
              onClick={handleJoin}
              className="cyber-button w-full inline-flex items-center justify-center gap-2 py-3 text-sm font-semibold mt-2"
            >
              <Phone className="h-4 w-4" />
              Capture the call
            </button>
          </div>

          <p className="mt-4 text-[10px] text-slate-600 text-center">
            Share the Room ID with other participants. Open this page in another tab to test multi-user detection.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
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
          {participants.length + 1} participant{participants.length !== 0 ? 's' : ''}
        </span>
      </div>

      <AnimatePresence>
        {showDeepfakeAlert && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="glass-card flex items-center gap-2 border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-rose-200"
          >
            <AlertTriangle className="h-4 w-4" />
            <span className="text-xs font-medium">Possible Deepfake Detected</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={`grid gap-3 ${
        participants.length === 0 ? 'grid-cols-1' :
        participants.length <= 1 ? 'grid-cols-2' :
        'grid-cols-2'
      }`}>
        <div className={`glass-card relative overflow-hidden p-2 ${getStatusColor(participantScores.local?.status || 'REAL')}`}>
          <div className="relative aspect-video overflow-hidden rounded-xl bg-black">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="h-full w-full object-cover"
            />
            <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
              <span className="rounded-lg bg-black/60 backdrop-blur-sm px-2 py-1 text-[10px] text-white">
                {username || 'You'} (local)
              </span>
              {participantScores.local && getStatusBadge(
                participantScores.local.score,
                participantScores.local.status
              )}
            </div>
          </div>
        </div>

        <AnimatePresence>
          {participants.map((p) => (
            <motion.div
              key={p.sid}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`glass-card relative overflow-hidden p-2 ${getStatusColor(participantScores[p.sid]?.status || 'REAL')}`}
            >
              <div className="relative aspect-video overflow-hidden rounded-xl bg-black">
                <video
                  ref={(el) => {
                    if (el) {
                      remoteVideoRefs.current[p.sid] = el;
                      if (p.stream) el.srcObject = p.stream;
                    }
                  }}
                  autoPlay
                  playsInline
                  className="h-full w-full object-cover"
                />
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                  <span className="rounded-lg bg-black/60 backdrop-blur-sm px-2 py-1 text-[10px] text-white">
                    {p.username}
                  </span>
                  {participantScores[p.sid] && getStatusBadge(
                    participantScores[p.sid].score,
                    participantScores[p.sid].status
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="glass-card flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="inline-flex items-center gap-2 text-xs text-slate-500">
          <Activity className="h-3.5 w-3.5 text-brand-cyan/70" />
          Detection packets sent every 2 seconds with face-aware gating.
        </div>
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
