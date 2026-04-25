import { useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Activity, Clock, Cpu, ShieldAlert, TrendingUp } from 'lucide-react';

/**
 * DetectionSidebar — shared right panel for all 3 detection modes.
 * Shows: risk score gauge, status badge, timeline chart, and detection logs.
 */
export default function DetectionSidebar({ latestResult, logs, timelineData, connected }) {
  const logsEndRef = useRef(null);

  const riskScore = latestResult?.risk_score ?? 0;
  const status = latestResult?.status ?? 'IDLE';
  const engine = latestResult?.engine ?? '--';
  const faceCount = latestResult?.face_count ?? 0;
  const processingTime = latestResult?.processing_time_ms ?? 0;

  // Auto-scroll logs (container only — never scroll the page itself)
  useEffect(() => {
    const el = logsEndRef.current;
    if (el?.parentElement) {
      el.parentElement.scrollTop = el.parentElement.scrollHeight;
    }
  }, [logs]);

  // Score colors
  const scoreConfig = useMemo(() => {
    if (riskScore >= 70) return { gradient: 'from-rose-500 to-rose-400', color: '#f43f5e', label: 'FAKE', badgeClass: 'border-rose-400/30 bg-rose-400/8 text-rose-200' };
    if (riskScore >= 40) return { gradient: 'from-amber-500 to-amber-400', color: '#f59e0b', label: 'SUSPICIOUS', badgeClass: 'border-amber-400/30 bg-amber-400/8 text-amber-200' };
    return { gradient: 'from-emerald-500 to-emerald-400', color: '#34d399', label: 'REAL', badgeClass: 'border-emerald-400/30 bg-emerald-400/8 text-emerald-200' };
  }, [riskScore]);

  // SVG gauge
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (riskScore / 100) * circumference;
  
  const realScore = 100 - riskScore;
  const realOffset = circumference - (realScore / 100) * circumference;

  const realScoreConfig = useMemo(() => {
    return { color: '#34d399' };
  }, [riskScore]);

  return (
    <div className="flex flex-col gap-3">
      {/* Connection status */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${connected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
          <span className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
            {connected ? 'Server Connected' : 'Disconnected'}
          </span>
        </div>
        <span className="cyber-badge text-[9px]">
          <Cpu className="h-3 w-3" />
          {engine}
        </span>
      </div>

      {/* Risk Score Card */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Risk Assessment</p>
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium ${scoreConfig.badgeClass}`}>
            <div className={`h-1.5 w-1.5 rounded-full animate-pulse`} style={{ background: scoreConfig.color }} />
            {status}
          </span>
        </div>

        <div className="flex items-center justify-center gap-4 xl:gap-2">
          {/* Deepfake Score */}
          <div className="relative h-32 w-32">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 128 128">
              <circle cx="64" cy="64" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
              <motion.circle
                cx="64" cy="64" r={radius}
                fill="none"
                stroke={scoreConfig.color}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                animate={{ strokeDashoffset: offset }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                style={{ filter: `drop-shadow(0 0 8px ${scoreConfig.color}40)` }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.p
                key={`fake-${riskScore}`}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-2xl font-bold text-white"
              >
                {riskScore}<span className="text-sm text-slate-400">%</span>
              </motion.p>
              <p className="mt-0.5 text-[8px] uppercase tracking-[0.2em] text-slate-600">Deepfake</p>
            </div>
          </div>

          {/* Real Score */}
          <div className="relative h-32 w-32">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 128 128">
              <circle cx="64" cy="64" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
              <motion.circle
                cx="64" cy="64" r={radius}
                fill="none"
                stroke={realScoreConfig.color}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                animate={{ strokeDashoffset: realOffset }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                style={{ filter: `drop-shadow(0 0 8px ${realScoreConfig.color}40)` }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.p
                key={`real-${realScore}`}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-2xl font-bold text-white"
              >
                {realScore}<span className="text-sm text-slate-400">%</span>
              </motion.p>
              <p className="mt-0.5 text-[8px] uppercase tracking-[0.2em] text-slate-600">Real</p>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg border border-white/6 bg-black/20 px-2 py-2">
            <p className="text-[9px] text-slate-600">Faces</p>
            <p className="text-sm font-semibold text-white">{faceCount}</p>
          </div>
          <div className="rounded-lg border border-white/6 bg-black/20 px-2 py-2">
            <p className="text-[9px] text-slate-600">Latency</p>
            <p className="text-sm font-semibold text-white">{processingTime}ms</p>
          </div>
          <div className="rounded-lg border border-white/6 bg-black/20 px-2 py-2">
            <p className="text-[9px] text-slate-600">Frames</p>
            <p className="text-sm font-semibold text-white">{timelineData.length}</p>
          </div>
        </div>
      </div>

      {/* Timeline Chart */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="h-3.5 w-3.5 text-brand-cyan/60" />
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Risk Timeline</p>
        </div>

        {timelineData.length > 1 ? (
          <ResponsiveContainer width="100%" height={120}>
            <AreaChart data={timelineData}>
              <defs>
                <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="time" hide />
              <YAxis domain={[0, 100]} hide />
              <Tooltip
                contentStyle={{
                  background: 'rgba(15, 23, 42, 0.95)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  fontSize: '11px',
                  color: '#e2e8f0',
                }}
                labelStyle={{ color: '#94a3b8' }}
              />
              <Area
                type="monotone"
                dataKey="score"
                stroke="#38bdf8"
                strokeWidth={2}
                fill="url(#scoreGradient)"
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-[120px] items-center justify-center text-xs text-slate-600">
            Awaiting detection data...
          </div>
        )}
      </div>

      {/* Detection Logs */}
      <div className="glass-card flex flex-col max-h-72 overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/8 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-3.5 w-3.5 text-brand-cyan/60" />
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Detection Logs</p>
          </div>
          <span className="text-[9px] text-slate-600">{logs.length} entries</span>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          {logs.length === 0 && (
            <p className="py-4 text-center text-xs text-slate-600">No logs yet. Start detection to see results.</p>
          )}
          {logs.map((entry) => {
            const levelClass = {
              danger: 'border-rose-400/20 bg-rose-400/5 text-rose-200',
              warning: 'border-amber-400/20 bg-amber-400/5 text-amber-200',
              error: 'border-red-400/20 bg-red-400/5 text-red-300',
              info: 'border-white/6 bg-white/[0.02] text-slate-400',
            }[entry.level] || 'border-white/6 bg-white/[0.02] text-slate-400';

            return (
              <div key={entry.id} className={`rounded-lg border px-3 py-1.5 text-[11px] ${levelClass}`}>
                <div className="flex items-start justify-between gap-2">
                  <span className="leading-relaxed break-all">{entry.text}</span>
                  <span className="shrink-0 text-[9px] text-slate-600 font-mono">{entry.time}</span>
                </div>
              </div>
            );
          })}
          <div ref={logsEndRef} />
        </div>
      </div>
    </div>
  );
}
