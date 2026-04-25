import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, PhoneOff, Users, Video, Copy, Check } from 'lucide-react';

/**
 * WebRTCMode — multi-user video call with per-participant detection.
 * Uses WebRTC for peer-to-peer video and Socket.IO for signaling.
 * Captures frames from each video element and sends them for analysis.
 */
export default function WebRTCMode({
  socket,
  localStream,
  participants,
  inRoom,
  joinRoom,
  leaveRoom,
  sendWebRTCFrame,
  addLog,
}) {
  const [roomInput, setRoomInput] = useState('');
  const [username, setUsername] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [roomIdDisplay, setRoomIdDisplay] = useState('');
  const [copied, setCopied] = useState(false);
  const [participantScores, setParticipantScores] = useState({});

  const localVideoRef = useRef(null);
  const remoteVideoRefs = useRef({});
  const captureRef = useRef(null);
  const canvasRef = useRef(null);

  // Attach local stream to video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Frame capture loop for all participants
  useEffect(() => {
    if (!inRoom) return;

    const canvas = document.createElement('canvas');
    canvasRef.current = canvas;

    captureRef.current = setInterval(() => {
      // Capture local video frame
      if (localVideoRef.current && localVideoRef.current.readyState >= 2) {
        canvas.width = localVideoRef.current.videoWidth || 640;
        canvas.height = localVideoRef.current.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(localVideoRef.current, 0, 0);
        const frame = canvas.toDataURL('image/jpeg', 0.6);
        sendWebRTCFrame(frame, socket?.id || 'local');
      }

      // Capture remote participant frames
      Object.entries(remoteVideoRefs.current).forEach(([sid, videoEl]) => {
        if (videoEl && videoEl.readyState >= 2) {
          canvas.width = videoEl.videoWidth || 320;
          canvas.height = videoEl.videoHeight || 240;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(videoEl, 0, 0);
          const frame = canvas.toDataURL('image/jpeg', 0.6);
          sendWebRTCFrame(frame, sid);
        }
      });
    }, 1000); // Capture every 1s per participant

    return () => {
      if (captureRef.current) clearInterval(captureRef.current);
    };
  }, [inRoom, sendWebRTCFrame, socket]);

  // Listen for per-participant detection results
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
  const handleJoin = useCallback(() => {
    const room = roomInput.trim() || `aegis-${Math.random().toString(36).slice(2, 8)}`;
    const name = username.trim() || `Analyst-${Math.random().toString(36).slice(2, 5)}`;
    setRoomIdDisplay(room);
    joinRoom(room, name);
    addLog?.('info', `Joining room "${room}" as "${name}"...`);
  }, [roomInput, username, joinRoom, addLog]);

  // Leave
  const handleLeave = useCallback(() => {
    leaveRoom();
    setParticipantScores({});
    addLog?.('info', 'Left the room.');
  }, [leaveRoom, addLog]);

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
              Join Room
            </button>
          </div>

          <p className="mt-4 text-[10px] text-slate-600 text-center">
            Share the Room ID with other participants. Open this page in another tab to test multi-user detection.
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

      {/* Video grid */}
      <div className={`grid gap-3 ${
        participants.length === 0 ? 'grid-cols-1' :
        participants.length <= 1 ? 'grid-cols-2' :
        'grid-cols-2'
      }`}>
        {/* Local participant */}
        <div className={`glass-card relative overflow-hidden p-2 ${getStatusColor(participantScores[socket?.id]?.status || 'REAL')}`}>
          <div className="relative aspect-video overflow-hidden rounded-xl bg-black">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="h-full w-full object-cover"
            />
            {/* Overlay info */}
            <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
              <span className="rounded-lg bg-black/60 backdrop-blur-sm px-2 py-1 text-[10px] text-white">
                {username || 'You'} (local)
              </span>
              {participantScores[socket?.id] && getStatusBadge(
                participantScores[socket.id].score,
                participantScores[socket.id].status
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
