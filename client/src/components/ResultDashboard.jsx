import { motion } from 'framer-motion';
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  RefreshCw,
  Radar,
  ShieldAlert,
} from 'lucide-react';

function ScoreGauge({ score }) {
  const normalized = Math.min(100, Math.max(0, score));
  const radius = 74;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (normalized / 100) * circumference;

  return (
    <div className="relative mx-auto h-48 w-48">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 180 180" aria-label="Deepfake Score Gauge">
        <circle cx="90" cy="90" r={radius} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="14" />
        <motion.circle
          cx="90"
          cy="90"
          r={radius}
          fill="none"
          stroke="url(#gaugeGradient)"
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
        <defs>
          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="50%" stopColor="#6366F1" />
            <stop offset="100%" stopColor="#8B5CF6" />
          </linearGradient>
        </defs>
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-4xl font-semibold text-white">{normalized}%</p>
        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Deepfake Score</p>
      </div>
    </div>
  );
}

function LabelBadge({ label }) {
  if (label === 'Fake') {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-rose-400/40 bg-rose-400/10 px-3 py-1 text-sm text-rose-200">
        <AlertTriangle className="h-4 w-4" />
        Fake
      </span>
    );
  }
  if (label === 'Suspicious') {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-sm text-amber-200">
        <ShieldAlert className="h-4 w-4" />
        Suspicious
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-400/10 px-3 py-1 text-sm text-emerald-200">
      <CheckCircle2 className="h-4 w-4" />
      Real
    </span>
  );
}

export default function ResultDashboard({ result, previewUrl, onDownload, onReanalyze }) {
  const mode = result?.mode || 'video';

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-12">
        <div className="glass-card overflow-hidden p-4 md:p-5 xl:col-span-7">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Analyzed Media</p>
            <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.16em] text-brand-cyan">
              {mode} mode
            </span>
          </div>

          <div className="relative aspect-video overflow-hidden rounded-2xl border border-white/10 bg-slate-950">
            {previewUrl && mode === 'image' && (
              <img src={previewUrl} alt="Analyzed media" className="h-full w-full object-cover" />
            )}

            {previewUrl && mode !== 'image' && mode !== 'voice' && (
              <video src={previewUrl} controls className="h-full w-full bg-black object-cover" />
            )}

            {mode === 'voice' && (
              <div className="flex h-full flex-col items-center justify-center gap-6 bg-[radial-gradient(circle_at_50%_10%,rgba(56,189,248,0.2),transparent_55%)] px-6">
                <p className="text-sm uppercase tracking-[0.22em] text-slate-300">Voice Spectrum Snapshot</p>
                <div className="flex h-24 w-full items-end justify-center gap-1.5">
                  {Array.from({ length: 34 }, (_, idx) => (
                    <span
                      key={idx}
                      className="w-1 rounded bg-gradient-to-t from-brand-indigo to-brand-cyan"
                      style={{ height: `${30 + Math.abs(Math.sin(idx / 2)) * 70}%` }}
                    />
                  ))}
                </div>
              </div>
            )}

            {!previewUrl && mode !== 'voice' && (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">No media preview available</div>
            )}

            <div className="pointer-events-none absolute inset-0">
              <div className="absolute left-[18%] top-[24%] h-16 w-24 rounded-full bg-rose-500/20 blur-2xl" />
              <div className="absolute bottom-[18%] right-[22%] h-16 w-20 rounded-full bg-amber-400/20 blur-2xl" />
              <div className="absolute bottom-[28%] left-[40%] h-12 w-12 rounded-full bg-brand-cyan/20 blur-xl" />
            </div>
          </div>
        </div>

        <div className="glass-card p-6 xl:col-span-5">
          <ScoreGauge score={result.score} />
          <div className="mt-5 flex flex-col items-center gap-2 text-center">
            <LabelBadge label={result.label} />
            <p className="max-w-sm text-sm leading-relaxed text-slate-300">{result.summary}</p>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Confidence {result.confidence}%</p>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <button onClick={onDownload} className="cyber-button inline-flex items-center justify-center gap-2 py-2 text-sm">
              <Download className="h-4 w-4" />
              Download Report
            </button>
            <button
              onClick={onReanalyze}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 py-2 text-sm text-slate-200 transition hover:border-brand-cyan/70 hover:text-white"
            >
              <RefreshCw className="h-4 w-4" />
              Re-analyze
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-12">
        <div className="glass-card p-5 xl:col-span-7">
          <h3 className="text-lg font-semibold text-white">Detection Insights</h3>
          <div className="mt-4 space-y-3">
            {result.insights.map((insight) => (
              <div key={insight.id} className="rounded-xl border border-white/10 bg-black/25 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm text-slate-200">{insight.title}</p>
                  <span
                    className={[
                      'rounded-full border px-2 py-1 text-xs uppercase tracking-[0.15em]',
                      insight.severity === 'High'
                        ? 'border-rose-400/40 bg-rose-400/10 text-rose-200'
                        : insight.severity === 'Medium'
                          ? 'border-amber-400/40 bg-amber-400/10 text-amber-200'
                          : 'border-emerald-400/40 bg-emerald-400/10 text-emerald-200',
                    ].join(' ')}
                  >
                    {insight.severity}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-400">Signal confidence: {insight.confidence}%</p>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card p-5 xl:col-span-5">
          <div className="mb-4 flex items-center gap-2">
            <Radar className="h-4 w-4 text-brand-cyan" />
            <h3 className="text-lg font-semibold text-white">Timeline Drift Graph</h3>
          </div>
          <div className="flex h-48 items-end gap-2 rounded-xl border border-white/10 bg-black/25 p-4">
            {result.timeline.map((point, idx) => (
              <motion.div
                key={`${idx}-${point}`}
                initial={{ height: 0 }}
                animate={{ height: `${point}%` }}
                transition={{ delay: idx * 0.03, duration: 0.35 }}
                className="flex-1 rounded-t bg-gradient-to-t from-brand-indigo via-brand-cyan to-brand-violet"
              />
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-400">
            Graph simulates frame-by-frame anomaly confidence progression over the analyzed sample.
          </p>
        </div>
      </section>
    </div>
  );
}
