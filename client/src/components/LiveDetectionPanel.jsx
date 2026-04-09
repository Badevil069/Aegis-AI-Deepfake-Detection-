import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, Mic, Monitor, Play, Square, TriangleAlert, Users } from 'lucide-react';
import { liveLogSeeds, participantTiles } from '../data/mockData';

function randomWave() {
  return Array.from({ length: 22 }, () => Math.floor(Math.random() * 80) + 20);
}

export default function LiveDetectionPanel() {
  const [isRunning, setIsRunning] = useState(false);
  const [riskScore, setRiskScore] = useState(34);
  const [logs, setLogs] = useState([
    { id: 1, text: 'Live simulation ready. Waiting for operator action.', tone: 'neutral' },
  ]);
  const [waveBars, setWaveBars] = useState(randomWave());
  const [frameRate, setFrameRate] = useState(24);
  const logsBottomRef = useRef(null);

  const statusLabel = useMemo(() => {
    if (riskScore >= 75) return { text: 'High Risk', className: 'text-rose-300 border-rose-400/40 bg-rose-400/10' };
    if (riskScore >= 45) return { text: 'Suspicious', className: 'text-amber-300 border-amber-400/40 bg-amber-400/10' };
    return { text: 'Likely Real', className: 'text-emerald-300 border-emerald-400/40 bg-emerald-400/10' };
  }, [riskScore]);

  useEffect(() => {
    logsBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  useEffect(() => {
    const waveTimer = setInterval(() => {
      setWaveBars(randomWave());
    }, 220);

    return () => clearInterval(waveTimer);
  }, []);

  useEffect(() => {
    if (!isRunning) return undefined;

    const detectTimer = setInterval(() => {
      setRiskScore((prev) => {
        const drift = Math.floor(Math.random() * 14) - 4;
        return Math.min(99, Math.max(8, prev + drift));
      });

      setFrameRate(() => Math.floor(Math.random() * 6) + 22);

      setLogs((prev) => {
        const text = liveLogSeeds[Math.floor(Math.random() * liveLogSeeds.length)];
        const tone = text.toLowerCase().includes('anomaly') || text.toLowerCase().includes('suspicious')
          ? 'warning'
          : 'neutral';
        const next = [...prev, { id: Date.now(), text, tone }];
        return next.slice(-16);
      });
    }, 1400);

    return () => clearInterval(detectTimer);
  }, [isRunning]);

  const startDetection = () => {
    setIsRunning(true);
    setLogs((prev) => [...prev, { id: Date.now(), text: 'Detection pipeline engaged. Streaming telemetry.', tone: 'good' }]);
  };

  const stopDetection = () => {
    setIsRunning(false);
    setLogs((prev) => [...prev, { id: Date.now(), text: 'Detection paused. Snapshot retained for review.', tone: 'neutral' }]);
  };

  return (
    <section className="grid gap-6 lg:grid-cols-12">
      <div className="glass-card relative overflow-hidden p-4 md:p-5 lg:col-span-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.2em] text-brand-cyan">
            <Monitor className="h-3 w-3" />
            Live Session Monitor
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/30 px-3 py-1 text-xs text-slate-300">
            <Activity className="h-3 w-3" />
            {frameRate} FPS
          </div>
        </div>

        <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-950 to-black">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(56,189,248,0.15),transparent_55%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_70%,rgba(139,92,246,0.18),transparent_50%)]" />
          <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/45 px-3 py-1 text-xs text-slate-200">
            <Users className="h-3 w-3" />
            Zoom/Meet Style Simulation
          </div>

          <motion.div
            animate={isRunning ? { opacity: [0.15, 0.35, 0.15] } : { opacity: 0.15 }}
            transition={{ repeat: Infinity, duration: 2.8 }}
            className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-brand-cyan to-transparent"
          />

          <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-4">
            <div className="rounded-xl border border-white/15 bg-black/45 px-3 py-2 text-xs text-slate-200">
              Primary Webcam Feed
            </div>
            <div className="rounded-xl border border-white/15 bg-black/45 px-3 py-2">
              <div className="mb-2 inline-flex items-center gap-2 text-xs text-slate-300">
                <Mic className="h-3 w-3 text-brand-cyan" />
                Mic Input
              </div>
              <div className="flex h-8 items-end gap-1">
                {waveBars.map((value, idx) => (
                  <span
                    key={`${idx}-${value}`}
                    className="w-1 rounded bg-gradient-to-t from-brand-indigo to-brand-cyan"
                    style={{ height: `${value}%` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          {participantTiles.map((tile) => (
            <div
              key={tile.name}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-center text-xs text-slate-300"
            >
              <p className="font-medium text-slate-200">{tile.name}</p>
              <p className="mt-1 uppercase tracking-[0.16em] text-slate-500">{tile.role}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card flex flex-col gap-4 p-4 md:p-5 lg:col-span-4">
        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Real-time Risk Score</p>
          <div className="mt-3 flex items-end justify-between">
            <p className="text-4xl font-semibold text-white">{riskScore}%</p>
            <span className={`rounded-full border px-3 py-1 text-xs ${statusLabel.className}`}>
              {statusLabel.text}
            </span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full bg-gradient-to-r from-brand-cyan via-brand-indigo to-brand-violet"
              animate={{ width: `${riskScore}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={startDetection}
            className="cyber-button inline-flex items-center justify-center gap-2 py-2 text-sm"
          >
            <Play className="h-4 w-4" />
            Start Detection
          </button>
          <button
            onClick={stopDetection}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 py-2 text-sm text-slate-200 transition hover:border-rose-400/60 hover:text-white"
          >
            <Square className="h-4 w-4" />
            Stop
          </button>
        </div>

        <div className="flex-1 overflow-hidden rounded-xl border border-white/10 bg-black/30">
          <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Live Detection Logs</p>
            <TriangleAlert className="h-4 w-4 text-brand-cyan" />
          </div>
          <div className="max-h-72 space-y-2 overflow-y-auto px-3 py-3 text-xs">
            {logs.map((entry) => (
              <p
                key={entry.id}
                className={[
                  'rounded-md border px-2 py-1',
                  entry.tone === 'warning'
                    ? 'border-amber-400/30 bg-amber-400/10 text-amber-200'
                    : entry.tone === 'good'
                      ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200'
                      : 'border-white/10 bg-white/5 text-slate-300',
                ].join(' ')}
              >
                {entry.text}
              </p>
            ))}
            <div ref={logsBottomRef} />
          </div>
        </div>
      </div>
    </section>
  );
}
