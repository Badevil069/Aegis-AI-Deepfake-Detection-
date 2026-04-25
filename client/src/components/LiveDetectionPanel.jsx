import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  Camera,
  CameraOff,
  Mic,
  MicOff,
  Monitor,
  Phone,
  Play,
  Square,
  TriangleAlert,
  Users,
  Video,
} from 'lucide-react';
import { liveLogSeeds, participantTiles } from '../data/mockData';

function randomWave() {
  return Array.from({ length: 28 }, () => Math.floor(Math.random() * 85) + 15);
}

export default function LiveDetectionPanel() {
  const [isRunning, setIsRunning] = useState(false);
  const [riskScore, setRiskScore] = useState(0);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [logs, setLogs] = useState([
    { id: 1, text: 'Live simulation ready. Waiting for operator action.', tone: 'neutral', time: new Date().toLocaleTimeString() },
  ]);
  const [waveBars, setWaveBars] = useState(randomWave());
  const [latency, setLatency] = useState(0);
  const [faces, setFaces] = useState(0);
  const [duration, setDuration] = useState(0);
  const logsBottomRef = useRef(null);

  const videoRef = useRef(null);
  const wsRef = useRef(null);
  const captureIntervalRef = useRef(null);
  const streamRef = useRef(null);

  const statusLabel = useMemo(() => {
    if (riskScore >= 75) return { text: 'HIGH RISK', className: 'text-rose-300 border-rose-400/30 bg-rose-400/8', dot: 'bg-rose-400' };
    if (riskScore >= 45) return { text: 'SUSPICIOUS', className: 'text-amber-300 border-amber-400/30 bg-amber-400/8', dot: 'bg-amber-400' };
    return { text: 'LIKELY REAL', className: 'text-emerald-300 border-emerald-400/30 bg-emerald-400/8', dot: 'bg-emerald-400' };
  }, [riskScore]);

  const scoreColor = useMemo(() => {
    if (riskScore >= 75) return 'from-rose-500 to-rose-400';
    if (riskScore >= 45) return 'from-amber-500 to-amber-400';
    return 'from-emerald-500 to-emerald-400';
  }, [riskScore]);

  useEffect(() => {
    logsBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  useEffect(() => {
    const waveTimer = setInterval(() => setWaveBars(randomWave()), 200);
    return () => clearInterval(waveTimer);
  }, []);

  useEffect(() => {
    if (!isRunning) return undefined;
    const timer = setInterval(() => setDuration((p) => p + 1), 1000);
    return () => clearInterval(timer);
  }, [isRunning]);

  useEffect(() => {
    return () => {
      if (captureIntervalRef.current) clearInterval(captureIntervalRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  const formatDuration = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  const startScreenCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      return stream;
    } catch (err) {
      return null;
    }
  };

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      return stream;
    } catch (err) {
      return null;
    }
  };

  const startDetection = async () => {
    setIsRunning(true);
    setDuration(0);
    setLogs((prev) => [...prev, { id: Date.now(), text: 'Detection pipeline engaged. Connecting to stream...', tone: 'good', time: new Date().toLocaleTimeString() }]);

    let stream = await startScreenCapture();
    if (!stream) {
      stream = await startWebcam();
    }

    if (!stream) {
      setIsRunning(false);
      setLogs((prev) => [...prev, { id: Date.now(), text: 'Capture failed. Detection aborted.', tone: 'warning', time: new Date().toLocaleTimeString() }]);
      return;
    }

    streamRef.current = stream;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/live-call`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setRiskScore(Math.round(data.fake_score * 100));
      setFaces(data.faces);
      setLatency(data.latency);

      if (data.fake_score > 0.8) {
        setLogs((prev) => [...prev, { id: Date.now(), text: '⚠️ Possible Deepfake Detected', tone: 'warning', time: new Date().toLocaleTimeString() }].slice(-20));
      }
    };

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    const captureFrame = () => {
      if (!videoRef.current || videoRef.current.readyState < 2) return;
      if (ws.readyState !== WebSocket.OPEN) return;

      canvas.width = 320;
      canvas.height = 240;
      ctx.drawImage(videoRef.current, 0, 0, 320, 240);

      const image = canvas.toDataURL("image/jpeg");

      ws.send(JSON.stringify({
        type: "frame",
        image: image,
        room: "live-room",
        user: "Analyst"
      }));
    };

    captureIntervalRef.current = setInterval(captureFrame, 2000);

    stream.getVideoTracks()[0].onended = () => {
      stopDetection();
    };
  };

  const stopDetection = () => {
    setIsRunning(false);
    
    if (captureIntervalRef.current) clearInterval(captureIntervalRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
    if (wsRef.current) wsRef.current.close();
    
    setLogs((prev) => [...prev, { id: Date.now(), text: 'Detection suspended. Snapshot retained for review.', tone: 'neutral', time: new Date().toLocaleTimeString() }]);
  };

  return (
    <div className="space-y-4">
      {/* Main grid */}
      <section className="grid gap-4 lg:grid-cols-12">
        {/* Video feed area */}
        <div className="glass-card relative overflow-hidden p-4 lg:col-span-8">
          {/* Header bar */}
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2">
              <div className="cyber-badge cyber-badge-glow text-[10px]">
                <Monitor className="h-3 w-3" />
                Live Session
              </div>
              {isRunning && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 text-[10px] font-medium text-rose-300">
                  <div className="h-1.5 w-1.5 rounded-full bg-rose-400 animate-pulse" />
                  REC {formatDuration(duration)}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-[10px] text-slate-400">
                <Activity className="h-3 w-3" />
                {latency} ms
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-[10px] text-slate-400">
                <Users className="h-3 w-3" />
                {faces} faces
              </span>
            </div>
          </div>

          {/* Main webcam feed */}
          <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-white/8 bg-gradient-to-br from-slate-900 via-slate-950 to-black">
            <video 
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 h-full w-full object-cover z-0" 
            />
            {/* Atmospheric overlays */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(56,189,248,0.12),transparent_55%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_70%,rgba(139,92,246,0.15),transparent_50%)]" />

            {/* Grid overlay */}
            <div className="pointer-events-none absolute inset-0 opacity-20">
              <div className="h-full w-full" style={{
                backgroundImage: 'linear-gradient(rgba(56,189,248,0.1) 1px, transparent 1px), linear-gradient(to right, rgba(56,189,248,0.1) 1px, transparent 1px)',
                backgroundSize: '40px 40px',
              }} />
            </div>

            {/* Session badge */}
            <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-lg border border-white/10 bg-black/50 backdrop-blur-sm px-3 py-1.5 text-xs text-slate-200">
              <Video className="h-3.5 w-3.5 text-brand-cyan" />
              Zoom/Meet-Style Simulation
            </div>

            {/* Scan line animation */}
            {isRunning && (
              <motion.div
                animate={{ top: ['0%', '100%', '0%'] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                className="pointer-events-none absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-cyan/50 to-transparent"
                style={{ boxShadow: '0 0 20px rgba(56, 189, 248, 0.3)' }}
              />
            )}

            {/* Waveform bar */}
            <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
              <div className="rounded-lg border border-white/10 bg-black/50 backdrop-blur-sm px-3 py-2 text-xs text-slate-200">
                Primary Webcam Feed
              </div>
              <div className="rounded-lg border border-white/10 bg-black/50 backdrop-blur-sm px-3 py-2">
                <div className="flex items-center gap-2 text-[10px] text-slate-400 mb-1">
                  <Mic className="h-3 w-3 text-brand-cyan" />
                  Voice Waveform
                </div>
                <div className="flex h-8 items-end gap-[2px]">
                  {waveBars.map((value, idx) => (
                    <span
                      key={`${idx}-${value}`}
                      className="w-[3px] rounded-sm transition-all duration-150"
                      style={{
                        height: `${micOn ? value : 10}%`,
                        background: `linear-gradient(to top, rgba(99,102,241,0.8), rgba(56,189,248,0.6))`,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Participant tiles */}
          <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
            {participantTiles.map((tile) => (
              <div
                key={tile.name}
                className="group relative overflow-hidden rounded-xl border border-white/8 bg-gradient-to-br from-slate-900/80 to-black/60 px-3 py-3 text-center transition-all duration-300 hover:border-brand-cyan/20"
              >
                {/* Person silhouette placeholder */}
                <div className="mx-auto mb-2 h-8 w-8 rounded-full bg-gradient-to-br from-white/10 to-white/5" />
                <p className="text-xs font-medium text-slate-200">{tile.name}</p>
                <p className="mt-0.5 text-[10px] uppercase tracking-[0.16em] text-slate-600">{tile.role}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right sidebar */}
        <div className="flex flex-col gap-3 lg:col-span-4">
          {/* Risk score card */}
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Real-time Risk</p>
              <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium ${statusLabel.className}`}>
                <div className={`h-1.5 w-1.5 rounded-full ${statusLabel.dot} ${isRunning ? 'animate-pulse' : ''}`} />
                {statusLabel.text}
              </span>
            </div>

            <div className="text-center py-2">
              <p className={`text-5xl font-bold bg-gradient-to-r ${scoreColor} bg-clip-text text-transparent`}>
                {riskScore}%
              </p>
            </div>

            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/8">
              <motion.div
                className={`h-full rounded-full bg-gradient-to-r ${scoreColor}`}
                animate={{ width: `${riskScore}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                style={{ boxShadow: `0 0 12px ${riskScore >= 75 ? 'rgba(244,63,94,0.4)' : riskScore >= 45 ? 'rgba(245,158,11,0.4)' : 'rgba(52,211,153,0.4)'}` }}
              />
            </div>
          </div>

          {/* Controls */}
          <div className="grid grid-cols-2 gap-2">
            <button
              id="start-detection-btn"
              onClick={startDetection}
              disabled={isRunning}
              className="cyber-button inline-flex items-center justify-center gap-2 py-3 text-sm disabled:opacity-40"
            >
              <Play className="h-4 w-4" />
              Start
            </button>
            <button
              id="stop-detection-btn"
              onClick={stopDetection}
              disabled={!isRunning}
              className="ghost-button inline-flex items-center justify-center gap-2 py-3 text-sm transition hover:border-rose-400/40 hover:text-rose-300 disabled:opacity-40"
            >
              <Square className="h-4 w-4" />
              Stop
            </button>
          </div>

          {/* Live logs */}
          <div className="glass-card flex-1 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Detection Logs</p>
              <TriangleAlert className="h-3.5 w-3.5 text-brand-cyan/60" />
            </div>
            <div className="flex-1 space-y-1.5 overflow-y-auto px-3 py-3 text-xs max-h-80">
              {logs.map((entry) => (
                <div
                  key={entry.id}
                  className={[
                    'rounded-lg border px-3 py-2',
                    entry.tone === 'warning'
                      ? 'border-amber-400/20 bg-amber-400/5 text-amber-200'
                      : entry.tone === 'good'
                        ? 'border-emerald-400/20 bg-emerald-400/5 text-emerald-200'
                        : 'border-white/6 bg-white/[0.02] text-slate-400',
                  ].join(' ')}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="leading-relaxed">{entry.text}</span>
                    <span className="shrink-0 text-[9px] text-slate-600 font-mono">{entry.time}</span>
                  </div>
                </div>
              ))}
              <div ref={logsBottomRef} />
            </div>
          </div>
        </div>
      </section>

      {/* Bottom control bar */}
      <div className="glass-card flex items-center justify-center gap-3 px-6 py-3">
        <button
          onClick={() => setCamOn(!camOn)}
          className={`inline-flex h-11 w-11 items-center justify-center rounded-xl transition-all ${
            camOn ? 'bg-white/8 text-white hover:bg-white/12' : 'bg-rose-500/15 text-rose-300 border border-rose-500/20'
          }`}
        >
          {camOn ? <Camera className="h-4.5 w-4.5" /> : <CameraOff className="h-4.5 w-4.5" />}
        </button>
        <button
          onClick={() => setMicOn(!micOn)}
          className={`inline-flex h-11 w-11 items-center justify-center rounded-xl transition-all ${
            micOn ? 'bg-white/8 text-white hover:bg-white/12' : 'bg-rose-500/15 text-rose-300 border border-rose-500/20'
          }`}
        >
          {micOn ? <Mic className="h-4.5 w-4.5" /> : <MicOff className="h-4.5 w-4.5" />}
        </button>
        <button className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-rose-500/20 border border-rose-500/30 px-6 text-sm font-medium text-rose-300 transition hover:bg-rose-500/30">
          <Phone className="h-4 w-4" />
          End Session
        </button>
      </div>
    </div>
  );
}
