import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone,
  PhoneOff,
  Users,
  Video,
  Copy,
  Check,
  AlertTriangle,
  Camera,
  Globe,
  ShieldAlert,
  Activity,
} from 'lucide-react';

/**
 * WebRTCMode — multi-user video call with live-call deepfake detection.
 * Uses WebRTC for peer-to-peer video and Socket.IO for signaling.
 * Live detection captures screen first (Zoom/Meet) with webcam fallback.
 */
export default function WebRTCMode({
  socket,
  localStream,
  participants,
  inRoom,
  joinRoom,
  leaveRoom,
  ingestLiveCallResult,
  addLog,
}) {
  const [roomInput, setRoomInput] = useState('');
  const [username, setUsername] = useState('');
  const [roomIdDisplay, setRoomIdDisplay] = useState('');
  const [copied, setCopied] = useState(false);
  const [participantScores, setParticipantScores] = useState({});
  const [isRunning, setIsRunning] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [captureSource, setCaptureSource] = useState('');
  const [showDeepfakeAlert, setShowDeepfakeAlert] = useState(false);
  const [joinError, setJoinError] = useState('');

  const localVideoRef = useRef(null);
  const remoteVideoRefs = useRef({});
  const wsRef = useRef(null);
  const detectionIntervalRef = useRef(null);
  const detectionVideoRef = useRef(null);
  const detectionCanvasRef = useRef(null);
  const detectionStreamRef = useRef(null);
  const isRunningRef = useRef(false);

  const localParticipantKey = useMemo(() => socket?.id || 'local', [socket?.id]);
  const localDetection = participantScores[localParticipantKey] || null;
  const localScore = localDetection?.score ?? 0;
  const participantCount = participants.length + 1;

  const setupChecklist = [
    {
      icon: Globe,
      title: 'Screen Capture First',
      detail: 'Optimized for Zoom / Meet windows and shared call screens.',
    },
    {
      icon: Camera,
      title: 'Webcam Fallback',
      detail: 'If screen capture is denied, webcam mode activates automatically.',
    },
    {
      icon: ShieldAlert,
      title: 'Real-Time Scoring',
      detail: 'Risk, faces, latency, and timeline update in the right sidebar.',
    },
  ];

  // Attach local stream to video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  const closeLiveCallSocket = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const stopDetection = useCallback((reason) => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }

    if (detectionStreamRef.current) {
      detectionStreamRef.current.getTracks().forEach((track) => track.stop());
      detectionStreamRef.current = null;
    }

    if (detectionVideoRef.current) {
      detectionVideoRef.current.pause();
      detectionVideoRef.current.srcObject = null;
    }

    closeLiveCallSocket();
    setCaptureSource('');
    setShowDeepfakeAlert(false);
    setIsRunning(false);
    isRunningRef.current = false;

    if (reason) {
      addLog?.('info', reason);
    }
  }, [addLog, closeLiveCallSocket]);

  const ensureDetectionVideo = useCallback(() => {
    if (!detectionVideoRef.current) {
      const video = document.createElement('video');
      video.autoplay = true;
      video.playsInline = true;
      video.muted = true;
      detectionVideoRef.current = video;
    }
    if (!detectionCanvasRef.current) {
      detectionCanvasRef.current = document.createElement('canvas');
    }
  }, []);

  const startScreenCapture = useCallback(async () => {
    try {
      ensureDetectionVideo();
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });

      if (detectionVideoRef.current) {
        detectionVideoRef.current.srcObject = stream;
        await detectionVideoRef.current.play();
      }

      const [screenTrack] = stream.getVideoTracks();
      if (screenTrack) {
        screenTrack.onended = () => {
          if (isRunningRef.current) {
            stopDetection('Screen sharing ended. Detection stopped.');
          }
        };
      }

      return stream;
    } catch (err) {
      return null;
    }
  }, [ensureDetectionVideo, stopDetection]);

  const startWebcam = useCallback(async () => {
    try {
      ensureDetectionVideo();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });

      if (detectionVideoRef.current) {
        detectionVideoRef.current.srcObject = stream;
        await detectionVideoRef.current.play();
      }

      return stream;
    } catch (err) {
      return null;
    }
  }, [ensureDetectionVideo]);

  const startLiveCallDetection = useCallback(async (room, user) => {
    ensureDetectionVideo();

    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/live-call`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      addLog?.('info', 'Live Call detection websocket connected.');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        ingestLiveCallResult?.(data);

        if (!data.error) {
          const score = Math.round((Number(data.fake_score) || 0) * 100);
          setParticipantScores((prev) => ({
            ...prev,
            [localParticipantKey]: {
              score,
              status: data.status || (score >= 80 ? 'FAKE' : score >= 50 ? 'SUSPICIOUS' : 'REAL'),
            },
          }));
          setShowDeepfakeAlert((Number(data.fake_score) || 0) > 0.8);
        }
      } catch (err) {
        addLog?.('error', `Live Call parsing error: ${err.message}`);
      }
    };

    ws.onerror = () => {
      addLog?.('error', 'Live Call websocket error.');
    };

    ws.onclose = () => {
      if (!isRunningRef.current) {
        return;
      }

      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
        detectionIntervalRef.current = null;
      }

      if (detectionStreamRef.current) {
        detectionStreamRef.current.getTracks().forEach((track) => track.stop());
        detectionStreamRef.current = null;
      }

      if (detectionVideoRef.current) {
        detectionVideoRef.current.pause();
        detectionVideoRef.current.srcObject = null;
      }

      setCaptureSource('');
      setShowDeepfakeAlert(false);
      setIsRunning(false);
      isRunningRef.current = false;
      addLog?.('warning', 'Live Call websocket closed. Detection stopped.');
    };

    let stream = await startScreenCapture();
    let source = 'screen';

    if (!stream) {
      stream = await startWebcam();
      source = 'webcam';
    }

    if (!stream) {
      addLog?.('error', 'Screen capture denied and webcam fallback failed.');
      closeLiveCallSocket();
      return false;
    }

    detectionStreamRef.current = stream;
    setCaptureSource(source);
    setIsRunning(true);
    isRunningRef.current = true;
    addLog?.('info', source === 'screen'
      ? 'Live Call detection started with screen capture.'
      : 'Live Call detection started with webcam fallback.');

    detectionIntervalRef.current = setInterval(() => {
      const video = detectionVideoRef.current;
      const canvas = detectionCanvasRef.current;

      if (!video || !canvas || video.readyState < 2 || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        return;
      }

      canvas.width = 320;
      canvas.height = 240;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(video, 0, 0, 320, 240);
      const image = canvas.toDataURL('image/jpeg', 0.7);

      wsRef.current.send(JSON.stringify({
        type: 'frame',
        image,
        room,
        user,
      }));
    }, 2000);

    return true;
  }, [addLog, closeLiveCallSocket, ensureDetectionVideo, ingestLiveCallResult, localParticipantKey, startScreenCapture, startWebcam]);

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
      const message = 'Enter your name to join the room.';
      setJoinError(message);
      addLog?.('warning', message);
      return;
    }

    if (!room) {
      const message = 'Enter or generate a Room ID to continue.';
      setJoinError(message);
      addLog?.('warning', message);
      return;
    }

    if (!socket?.connected) {
      const message = 'Server connection is not ready yet. Please wait a moment and retry.';
      setJoinError(message);
      addLog?.('warning', message);
      return;
    }

    setJoinError('');
    setIsJoining(true);
    try {
      const joined = await joinRoom(room, name);
      if (!joined) {
        const message = 'Could not access camera. Allow camera permissions and try again.';
        setJoinError(message);
        addLog?.('error', message);
        return;
      }

      setRoomIdDisplay(room);
      addLog?.('info', `Joining room "${room}" as "${name}"...`);

      const started = await startLiveCallDetection(room, name);
      if (!started) {
        const message = 'Live detection could not start. Check screen/webcam permissions and retry.';
        setJoinError(message);
        leaveRoom();
        setParticipantScores({});
        setIsRunning(false);
      }
    } finally {
      setIsJoining(false);
    }
  }, [roomInput, username, socket?.connected, joinRoom, addLog, startLiveCallDetection, leaveRoom]);

  // Leave
  const handleLeave = useCallback(() => {
    stopDetection('Live Call detection stopped.');
    leaveRoom();
    setParticipantScores({});
    setShowDeepfakeAlert(false);
    addLog?.('info', 'Left the room.');
  }, [leaveRoom, stopDetection, addLog]);
  useEffect(() => () => {
    stopDetection();
  }, [stopDetection]);


  // Copy room ID
  const copyRoomId = useCallback(() => {
    navigator.clipboard.writeText(roomIdDisplay).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      addLog?.('error', 'Unable to copy Room ID to clipboard.');
    });
  }, [addLog, roomIdDisplay]);

  const getStatusColor = (status) => {
    if (status === 'FAKE') return 'border-rose-500/50 bg-rose-500/10';
    if (status === 'SUSPICIOUS') return 'border-amber-500/50 bg-amber-500/10';
    return 'border-emerald-500/50 bg-emerald-500/10';
  };

  const getStatusBadge = (score, status) => {
    const colors = {
      FAKE: 'text-rose-300 border-rose-400/30 bg-rose-400/10',
      SUSPICIOUS: 'text-amber-300 border-amber-400/30 bg-amber-400/10',
      REAL: 'text-emerald-300 border-emerald-400/30 bg-emerald-400/10',
    };
    return (
      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-medium ${colors[status] || colors.REAL}`}>
        {score}% — {status}
      </span>
    );
  };

  if (!inRoom) {
    return (
      <div className="grid gap-3 xl:grid-cols-5">
        <div className="glass-card-elevated relative overflow-hidden p-6 xl:col-span-3">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(56,189,248,0.12),transparent_48%),radial-gradient(circle_at_90%_90%,rgba(99,102,241,0.1),transparent_42%)]" />

          <div className="relative">
            <div className="mb-5 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-brand-cyan/70" />
                <h3 className="text-lg font-semibold text-white">Live Call Command Deck</h3>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full border border-brand-cyan/30 bg-brand-cyan/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.15em] text-brand-cyan">
                <Activity className="h-3 w-3" />
                {socket?.connected ? 'Signal Ready' : 'Reconnecting'}
              </span>
            </div>

            <p className="mb-4 text-xs text-slate-400">
              Join a room to start deepfake detection. Screen capture is prioritized for conferencing apps; webcam fallback starts automatically when needed.
            </p>

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

              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleJoin}
                disabled={isJoining}
                className="cyber-button mt-2 inline-flex w-full items-center justify-center gap-2 py-3 text-sm font-semibold disabled:opacity-50"
              >
                <Phone className="h-4 w-4" />
                {isJoining ? 'Joining...' : 'Join Room'}
              </motion.button>

              {joinError && (
                <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
                  {joinError}
                </p>
              )}
            </div>

            <p className="mt-4 text-center text-[10px] text-slate-600">
              Share the same Room ID with collaborators. You can open this page in another tab to test multi-user behavior.
            </p>
          </div>
        </div>

        <div className="space-y-3 xl:col-span-2">
          <div className="glass-card p-4">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Detection Pipeline</p>
            <div className="space-y-3">
              {setupChecklist.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="rounded-xl border border-white/8 bg-black/20 px-3 py-2.5">
                    <div className="mb-1 flex items-center gap-2">
                      <div className="inline-flex h-6 w-6 items-center justify-center rounded-lg border border-brand-cyan/25 bg-brand-cyan/10 text-brand-cyan">
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <p className="text-xs font-medium text-white">{item.title}</p>
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-500">{item.detail}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="glass-card p-4">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Capture Profile</p>
            <div className="space-y-2 text-[11px] text-slate-500">
              <div className="flex items-center justify-between rounded-lg border border-white/8 bg-black/20 px-3 py-2">
                <span>Frame Size</span>
                <span className="font-mono text-slate-300">320 x 240</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-white/8 bg-black/20 px-3 py-2">
                <span>Cadence</span>
                <span className="font-mono text-slate-300">1 frame / 2s</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-white/8 bg-black/20 px-3 py-2">
                <span>No-Face Gate</span>
                <span className="font-mono text-slate-300">Enabled</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── In-room view ──
  return (
    <div className="space-y-3">
      <div className="glass-card relative overflow-hidden p-4">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.1),transparent_45%),radial-gradient(circle_at_80%_100%,rgba(99,102,241,0.09),transparent_50%)]" />

        <div className="relative space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <div className="cyber-badge cyber-badge-glow text-[10px]">
                <Users className="h-3 w-3" />
                Room: {roomIdDisplay}
              </div>

              <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] ${isRunning ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' : 'border-amber-500/30 bg-amber-500/10 text-amber-300'}`}>
                <div className={`h-1.5 w-1.5 rounded-full ${isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                {isRunning ? 'Detection Active' : 'Detection Idle'}
              </span>

              {isRunning && (
                <span className="inline-flex items-center gap-1 rounded-full border border-brand-cyan/30 bg-brand-cyan/10 px-2.5 py-1 text-[10px] text-brand-cyan">
                  {captureSource === 'screen' ? 'Screen Capture' : 'Webcam Fallback'}
                </span>
              )}
            </div>

            <button onClick={copyRoomId} className="inline-flex items-center gap-1 text-[10px] text-slate-500 transition hover:text-brand-cyan">
              {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
              {copied ? 'Copied!' : 'Copy ID'}
            </button>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-white/8 bg-black/20 px-3 py-2">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-600">Participants</p>
              <p className="mt-1 text-sm font-semibold text-white">{participantCount}</p>
            </div>
            <div className="rounded-xl border border-white/8 bg-black/20 px-3 py-2">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-600">Capture</p>
              <p className="mt-1 text-sm font-semibold text-white">{captureSource ? (captureSource === 'screen' ? 'Screen' : 'Webcam') : '--'}</p>
            </div>
            <div className="rounded-xl border border-white/8 bg-black/20 px-3 py-2">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-600">Cadence</p>
              <p className="mt-1 text-sm font-semibold text-white">0.5 FPS</p>
            </div>
            <div className="rounded-xl border border-white/8 bg-black/20 px-3 py-2">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-600">Local Risk</p>
              <p className="mt-1 text-sm font-semibold text-white">{localScore}%</p>
            </div>
          </div>
        </div>
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

      {/* Video grid */}
      <div className={`grid gap-3 ${
        participants.length === 0 ? 'grid-cols-1' :
        participants.length <= 1 ? 'grid-cols-1 md:grid-cols-2' :
        'grid-cols-1 md:grid-cols-2'
      }`}>
        {/* Local participant */}
        <div className={`glass-card relative overflow-hidden p-2 ${getStatusColor(participantScores[localParticipantKey]?.status || 'REAL')}`}>
          <div className="relative aspect-video overflow-hidden rounded-xl bg-black scan-line">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="h-full w-full object-cover"
            />

            {isRunning && (
              <motion.div
                animate={{ top: ['0%', '100%', '0%'] }}
                transition={{ duration: 3.6, repeat: Infinity, ease: 'linear' }}
                className="pointer-events-none absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-cyan/70 to-transparent"
                style={{ boxShadow: '0 0 12px rgba(56,189,248,0.35)' }}
              />
            )}

            <div className="absolute left-2 top-2 flex items-center gap-1.5">
              <span className="rounded-md border border-white/15 bg-black/65 px-2 py-1 text-[9px] text-slate-100 backdrop-blur-sm">
                {username || 'You'}
              </span>
              <span className="rounded-md border border-brand-cyan/25 bg-brand-cyan/15 px-2 py-1 text-[9px] text-brand-cyan">
                Analyzer
              </span>
            </div>

            {/* Overlay info */}
            <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
              <span className="rounded-lg bg-black/60 backdrop-blur-sm px-2 py-1 text-[10px] text-white/90">
                Local Feed
              </span>
              {participantScores[localParticipantKey] && getStatusBadge(
                participantScores[localParticipantKey].score,
                participantScores[localParticipantKey].status
              )}
            </div>
          </div>
        </div>

        {/* Remote participants */}
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

                {!p.stream && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/70 text-slate-400">
                    <Video className="h-6 w-6" />
                    <p className="text-xs">Waiting for participant stream...</p>
                  </div>
                )}

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

      {/* Leave button */}
      <div className="glass-card flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="inline-flex items-center gap-2 text-xs text-slate-500">
          <Activity className="h-3.5 w-3.5 text-brand-cyan/70" />
          Detection packets sent every 2 seconds with face-aware gating.
        </div>
        <button
          onClick={handleLeave}
          className="inline-flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/15 px-6 py-2.5 text-sm font-medium text-rose-300 transition hover:bg-rose-500/25"
        >
          <PhoneOff className="h-4 w-4" />
          Leave Room
        </button>
      </div>
    </div>
  );
}
