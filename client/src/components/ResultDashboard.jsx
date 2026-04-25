import { motion } from 'framer-motion';
import {
  AlertTriangle, CheckCircle2, Download, Eye, Flame, FileText,
  RefreshCw, Radar, ShieldAlert, TrendingUp,
} from 'lucide-react';

/* ─────────── Score Gauge ─────────── */
function ScoreGauge({ score, isRealScore = false }) {
  const normalized = Math.min(100, Math.max(0, score));
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (normalized / 100) * circumference;

  const color = isRealScore
    ? { start: '#34d399', end: '#10b981', glow: 'rgba(52,211,153,0.25)' }
    : (score >= 75 ? { start: '#f43f5e', end: '#ef4444', glow: 'rgba(244,63,94,0.25)' }
       : score >= 45 ? { start: '#f59e0b', end: '#eab308', glow: 'rgba(245,158,11,0.25)' }
       : { start: '#34d399', end: '#10b981', glow: 'rgba(52,211,153,0.25)' });

  return (
    <div className="relative h-44 w-44 shrink-0">
      {/* Ambient glow behind gauge */}
      <div
        className="absolute inset-4 rounded-full blur-2xl opacity-40"
        style={{ background: `radial-gradient(circle, ${color.glow}, transparent 70%)` }}
      />
      <svg className="h-full w-full -rotate-90 relative z-10" viewBox="0 0 160 160" aria-label={isRealScore ? "Real Score Gauge" : "Deepfake Score Gauge"}>
        {/* Background track */}
        <circle cx="80" cy="80" r={radius} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="10" />
        {/* Secondary subtle track */}
        <circle cx="80" cy="80" r={radius} fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="16" />
        {/* Animated score arc */}
        <motion.circle
          cx="80" cy="80" r={radius} fill="none"
          stroke={`url(#gaugeGradient${isRealScore ? 'Real' : 'Fake'})`} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          style={{ filter: `drop-shadow(0 0 10px ${color.start}50)` }}
        />
        <defs>
          <linearGradient id={`gaugeGradient${isRealScore ? 'Real' : 'Fake'}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={color.start} />
            <stop offset="100%" stopColor={color.end} />
          </linearGradient>
        </defs>
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center z-10">
        <motion.p
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="text-4xl font-bold text-white"
        >
          {normalized}<span className="text-xl text-slate-400">%</span>
        </motion.p>
        <p className="mt-1 text-[9px] uppercase tracking-[0.2em] text-slate-500">{isRealScore ? 'Real Score' : 'Deepfake Score'}</p>
      </div>
    </div>
  );
}

/* ─────────── Label Badge ─────────── */
function LabelBadge({ label }) {
  const configs = {
    Fake: { icon: AlertTriangle, className: 'border-rose-400/30 bg-rose-400/8 text-rose-200', glow: 'shadow-[0_0_20px_rgba(244,63,94,0.2)]' },
    Suspicious: { icon: ShieldAlert, className: 'border-amber-400/30 bg-amber-400/8 text-amber-200', glow: 'shadow-[0_0_20px_rgba(245,158,11,0.2)]' },
    Real: { icon: CheckCircle2, className: 'border-emerald-400/30 bg-emerald-400/8 text-emerald-200', glow: 'shadow-[0_0_20px_rgba(52,211,153,0.2)]' },
  };
  const config = configs[label] || configs.Real;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium ${config.className} ${config.glow}`}>
      <Icon className="h-4 w-4" />
      {label}
    </span>
  );
}

/* ─────────── Insight Card ─────────── */
function InsightCard({ insight, index }) {
  const severityConfig = {
    High: { icon: Flame, className: 'border-rose-400/30 bg-rose-400/8 text-rose-200', barColor: 'from-rose-500 to-rose-400' },
    Medium: { icon: AlertTriangle, className: 'border-amber-400/30 bg-amber-400/8 text-amber-200', barColor: 'from-amber-500 to-amber-400' },
    Low: { icon: CheckCircle2, className: 'border-emerald-400/30 bg-emerald-400/8 text-emerald-200', barColor: 'from-emerald-500 to-emerald-400' },
  };
  const config = severityConfig[insight.severity] || severityConfig.Low;
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 * index, duration: 0.4 }}
      className="group rounded-xl border border-cyan-500/8 bg-[#0a0f1a]/60 p-4 transition-all duration-300 hover:border-cyan-500/25 hover:bg-[#0a0f1a]/80"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.04]">
            <Icon className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-300 transition-colors" />
          </div>
          <p className="text-sm text-slate-200">{insight.title}</p>
        </div>
        <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.15em] ${config.className}`}>
          {insight.severity}
        </span>
      </div>
      <div className="mt-2.5 flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/4">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${insight.confidence}%` }}
            transition={{ delay: 0.2 + 0.1 * index, duration: 0.6 }}
            className={`h-full rounded-full bg-gradient-to-r ${config.barColor}`}
            style={{ boxShadow: `0 0 6px ${config.barColor.includes('rose') ? 'rgba(244,63,94,0.3)' : config.barColor.includes('amber') ? 'rgba(245,158,11,0.3)' : 'rgba(52,211,153,0.3)'}` }}
          />
        </div>
        <span className="text-[10px] font-mono text-slate-500">{insight.confidence}%</span>
      </div>
    </motion.div>
  );
}

/* ─────────── Heatmap Overlay ─────────── */
function HeatmapOverlay() {
  return (
    <div className="pointer-events-none absolute inset-0">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
        <div className="absolute left-[18%] top-[24%] h-20 w-28 rounded-full bg-rose-500/15 blur-2xl" />
        <div className="absolute bottom-[18%] right-[22%] h-16 w-24 rounded-full bg-amber-400/15 blur-2xl" />
        <div className="absolute bottom-[35%] left-[40%] h-14 w-14 rounded-full bg-cyan-400/15 blur-xl" />
        <div className="absolute top-[40%] right-[35%] h-10 w-16 rounded-full bg-rose-400/10 blur-xl" />
      </motion.div>
    </div>
  );
}

function DocumentMetric({ label, value, tone = 'slate' }) {
  const toneClasses = {
    emerald: 'border-emerald-400/20 bg-emerald-400/8 text-emerald-100',
    amber: 'border-amber-400/20 bg-amber-400/8 text-amber-100',
    rose: 'border-rose-400/20 bg-rose-400/8 text-rose-100',
    cyan: 'border-cyan-400/20 bg-cyan-400/8 text-sky-100',
    slate: 'border-white/8 bg-[#0a0f1a]/50 text-slate-100',
  };

  return (
    <div className={`rounded-xl border px-3 py-2 ${toneClasses[tone] || toneClasses.slate}`}>
      <p className="text-[9px] uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-medium text-white">{value}</p>
    </div>
  );
}

function DocumentStatusBadge({ label, active, tone = 'slate' }) {
  const toneClasses = {
    emerald: active ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200' : 'border-white/8 bg-black/20 text-slate-500',
    amber: active ? 'border-amber-400/30 bg-amber-400/10 text-amber-200' : 'border-white/8 bg-black/20 text-slate-500',
    rose: active ? 'border-rose-400/30 bg-rose-400/10 text-rose-200' : 'border-white/8 bg-black/20 text-slate-500',
    cyan: active ? 'border-cyan-400/30 bg-cyan-400/10 text-cyan-300' : 'border-white/8 bg-black/20 text-slate-500',
    slate: 'border-white/8 bg-black/20 text-slate-300',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-medium uppercase tracking-[0.15em] ${toneClasses[tone] || toneClasses.slate}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-current animate-pulse' : 'bg-slate-600'}`} />
      {label}
    </span>
  );
}

function DocumentVerificationPanel({ result }) {
  const audit = result?.cloud_vision_audit || {};
  const review = result?.gemini_visual_scan || {};
  const metadata = audit.metadata || {};
  const details = Array.isArray(audit.details) ? audit.details : [];
  const extractedText = typeof audit.extracted_text === 'string' ? audit.extracted_text.trim() : '';
  const snippet = extractedText ? (extractedText.length > 320 ? `${extractedText.slice(0, 320).trim()}...` : extractedText) : 'No extracted text was returned for this document.';
  const lowerDetails = details.map((d) => String(d).toLowerCase());
  const validationStages = Array.isArray(metadata.validation_stages) ? metadata.validation_stages : [];
  const localFallback = Boolean(metadata.local_fallback_used) || lowerDetails.some((d) => d.includes('local heuristics completed'));
  const cloudStatus = metadata.cloud_vision_status || (metadata.cloud_vision_attempted ? 'attempted' : 'not_attempted');
  const vertexStatus = metadata.vertex_review_status || (review.review_mode ? review.review_mode : 'not_attempted');
  const visionReady = Boolean(metadata.vision_processing_status === 'Success' || cloudStatus === 'success');
  const tampered = Boolean(audit.is_tampered || review.is_deepfake);
  const integrityOk = audit.metadata_integrity !== false;
  const textReady = extractedText.length > 0;
  const secondPassState = vertexStatus || (review.details?.length ? 'reviewed' : 'skipped');

  const metadataRows = [
    { label: 'Document Type', value: metadata.document_type || 'unknown' },
    { label: 'Local Risk Score', value: typeof metadata.local_metadata_score === 'number' ? `${metadata.local_metadata_score}/5` : 'n/a' },
    { label: 'Blocks Detected', value: typeof metadata.blocks_detected === 'number' ? String(metadata.blocks_detected) : 'n/a' },
    { label: 'Review Mode', value: secondPassState.replace(/_/g, ' ') },
  ];

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-5 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-cyan-400/70" />
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Document Verification</p>
        </div>
        <span className="rounded-full border border-cyan-500/15 bg-cyan-500/5 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-cyan-400/70">
          Forensic Summary
        </span>
      </div>

      <div className="rounded-2xl border border-cyan-500/8 bg-[#0a0f1a]/40 p-4 md:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Analyzed file</p>
            <h4 className="mt-1 text-lg font-semibold text-white">{result?.filename || 'uploaded-document'}</h4>
            <p className="mt-1 text-sm text-slate-400">
              {tampered ? 'Document evidence contains tamper or spoofing signals.'
                : integrityOk ? 'Document structure appears consistent based on the validation pipeline.'
                : 'Integrity could not be fully verified from the validation pipeline.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <DocumentStatusBadge label="integrity" active={integrityOk} tone={integrityOk ? 'emerald' : 'rose'} />
            <DocumentStatusBadge label="tamper" active={tampered} tone={tampered ? 'rose' : 'emerald'} />
            <DocumentStatusBadge label="ocr" active={textReady} tone={textReady ? 'cyan' : 'amber'} />
            <DocumentStatusBadge label="cloud" active={cloudStatus === 'success'} tone={cloudStatus === 'success' ? 'cyan' : cloudStatus === 'fallback' ? 'amber' : 'slate'} />
            <DocumentStatusBadge label="vertex" active={secondPassState !== 'skipped' && secondPassState !== 'not_attempted'} tone={secondPassState !== 'skipped' && secondPassState !== 'not_attempted' ? 'amber' : 'slate'} />
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {metadataRows.map((item) => (
            <DocumentMetric key={item.label} label={item.label} value={item.value} tone="slate" />
          ))}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <DocumentMetric label="Cloud / Local Path" value={visionReady ? (localFallback ? 'Local + Cloud Vision' : 'Cloud Vision') : 'Local heuristics'} tone={visionReady ? (localFallback ? 'amber' : 'cyan') : 'rose'} />
          <DocumentMetric label="Confidence" value={`${Number(result?.confidence || 0)}%`} tone={tampered ? 'rose' : result?.label === 'Suspicious' ? 'amber' : 'emerald'} />
          <DocumentMetric label="Risk Label" value={result?.label || 'Real'} tone={tampered ? 'rose' : result?.label === 'Suspicious' ? 'amber' : 'emerald'} />
        </div>

        <div className="mt-4 rounded-2xl border border-cyan-500/8 bg-[#060a14]/50 p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Extracted Text Preview</p>
            <span className="text-[10px] text-slate-600">{extractedText ? `${extractedText.length} chars` : 'No text extracted'}</span>
          </div>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-300">{snippet}</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <DocumentMetric label="Validation Stages" value={validationStages.length ? validationStages.join(' → ') : 'local → cloud → vertex'} tone="slate" />
          <DocumentMetric label="Cloud Status" value={cloudStatus} tone={cloudStatus === 'success' ? 'cyan' : cloudStatus === 'fallback' ? 'amber' : 'rose'} />
          <DocumentMetric label="Vertex Status" value={secondPassState} tone={secondPassState !== 'skipped' && secondPassState !== 'not_attempted' ? 'amber' : 'slate'} />
        </div>

        {details.length > 0 && (
          <div className="mt-4 rounded-2xl border border-cyan-500/8 bg-[#060a14]/50 p-4">
            <div className="flex items-center gap-2">
              <Radar className="h-4 w-4 text-cyan-400/70" />
              <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Audit Findings</p>
            </div>
            <div className="mt-3 space-y-2">
              {details.slice(0, 6).map((detail, index) => {
                const dl = String(detail).toLowerCase();
                const severity = dl.includes('error') || dl.includes('missing') || dl.includes('failed') ? 'rose'
                  : dl.includes('suspicious') || dl.includes('macro') || dl.includes('tamper') ? 'amber' : 'emerald';
                return (
                  <div key={`${index}-${detail}`} className="flex items-start gap-2 rounded-xl border border-white/6 bg-white/[0.02] px-3 py-2">
                    <span className={`mt-1 h-2 w-2 rounded-full ${severity === 'rose' ? 'bg-rose-400' : severity === 'amber' ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                    <p className="text-sm text-slate-300">{detail}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────── Main Dashboard ─────────── */
export default function ResultDashboard({ result, previewUrl, onDownload, onReanalyze }) {
  const mode = result?.mode || 'video';

  return (
    <div className="space-y-6">
      {/* Top section: Media + Score */}
      <section className="grid gap-6 xl:grid-cols-12">
        {/* Left: Media preview */}
        <div className="deepshield-feature-card overflow-hidden xl:col-span-7" style={{ padding: '1.25rem' }}>
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-cyan-400/60" />
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Analyzed Media</p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/5 px-2.5 py-0.5 text-[9px] font-medium uppercase tracking-[0.12em] text-cyan-400/80">
              {mode} mode
            </span>
          </div>

          <div className="relative aspect-video overflow-hidden rounded-2xl border border-cyan-500/10 bg-gradient-to-br from-[#060a14] to-[#0a0f1a]">
            {mode === 'document' && <DocumentVerificationPanel result={result} />}

            {previewUrl && mode === 'image' && (
              <img src={previewUrl} alt="Analyzed media" className="h-full w-full object-cover" />
            )}

            {previewUrl && mode !== 'image' && mode !== 'voice' && mode !== 'document' && (
              <video src={previewUrl} controls className="h-full w-full bg-black object-cover" />
            )}

            {mode === 'voice' && (
              <div className="flex h-full flex-col items-center justify-center gap-6 bg-[radial-gradient(circle_at_50%_10%,rgba(0,242,255,0.1),transparent_55%)]">
                <p className="text-[10px] uppercase tracking-[0.25em] text-slate-500">Voice Spectrum Analysis</p>
                <div className="flex h-28 w-full max-w-md items-end justify-center gap-1">
                  {Array.from({ length: 40 }, (_, idx) => (
                    <motion.span
                      key={idx}
                      initial={{ height: '10%' }}
                      animate={{ height: `${30 + Math.abs(Math.sin(idx / 2.5)) * 70}%` }}
                      transition={{ delay: idx * 0.02, duration: 0.4 }}
                      className="w-1 rounded-sm bg-gradient-to-t from-blue-500/80 to-cyan-400/60"
                    />
                  ))}
                </div>
              </div>
            )}

            {!previewUrl && mode !== 'voice' && mode !== 'document' && (
              <div className="flex h-full items-center justify-center text-sm text-slate-600">No media preview available</div>
            )}

            {mode !== 'document' && <HeatmapOverlay />}
            {mode !== 'document' && (
              <div className="absolute right-3 top-3 rounded-lg border border-cyan-500/15 bg-[#0a0f1a]/70 backdrop-blur-sm px-2.5 py-1 text-[9px] uppercase tracking-wider text-cyan-400/60">
                Heatmap Overlay
              </div>
            )}
          </div>
        </div>

        {/* Right: Score + Actions */}
        <div className="deepshield-feature-card xl:col-span-5 flex flex-col" style={{ padding: '1.5rem' }}>
          <div className="flex flex-wrap items-center justify-center gap-4 xl:gap-2">
            <ScoreGauge score={result.score} />
            <ScoreGauge score={100 - result.score} isRealScore />
          </div>
          <div className="mt-6 flex flex-col items-center gap-3 text-center flex-1">
            <LabelBadge label={result.label} />
            <p className="max-w-sm text-sm leading-relaxed text-slate-400">{result.summary}</p>
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-600">
              Model Confidence: <span className="text-cyan-400/70 font-mono">{result.confidence}%</span>
            </p>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3">
            <button
              id="download-report-btn"
              onClick={onDownload}
              className="deepshield-btn-primary inline-flex items-center justify-center gap-2 py-3 text-sm interactive"
            >
              <Download className="h-4 w-4" />
              <span>Download</span>
            </button>
            <button
              id="reanalyze-btn"
              onClick={onReanalyze}
              className="deepshield-btn-secondary inline-flex items-center justify-center gap-2 py-3 text-sm interactive"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Re-analyze</span>
            </button>
          </div>
        </div>
      </section>

      {/* Bottom section: Insights + Timeline */}
      <section className="grid gap-6 xl:grid-cols-12">
        {/* Insights */}
        <div className="deepshield-feature-card xl:col-span-7" style={{ padding: '1.25rem' }}>
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 border border-cyan-500/15">
              <ShieldAlert className="h-4 w-4 text-cyan-400/70" />
            </div>
            <h3 className="text-lg font-semibold text-white deepshield-glow-text">Detection Insights</h3>
          </div>
          <div className="space-y-2.5">
            {result.insights.map((insight, index) => (
              <InsightCard key={insight.id} insight={insight} index={index} />
            ))}
          </div>
        </div>

        {/* Timeline drift */}
        <div className="deepshield-feature-card xl:col-span-5" style={{ padding: '1.25rem' }}>
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 border border-cyan-500/15">
              <TrendingUp className="h-4 w-4 text-cyan-400/70" />
            </div>
            <h3 className="text-lg font-semibold text-white deepshield-glow-text">Timeline Drift</h3>
          </div>
          <div className="flex h-48 items-end gap-1.5 rounded-xl border border-cyan-500/8 bg-[#060a14]/50 p-4">
            {result.timeline.map((point, idx) => (
              <motion.div
                key={`${idx}-${point}`}
                initial={{ height: 0 }}
                animate={{ height: `${point}%` }}
                transition={{ delay: idx * 0.04, duration: 0.4, ease: 'easeOut' }}
                className="group relative flex-1 cursor-pointer rounded-t interactive"
                style={{
                  background: `linear-gradient(to top, rgba(6,182,212,0.6), rgba(59,130,246,0.4))`,
                  boxShadow: point > 60 ? '0 0 8px rgba(6,182,212,0.2)' : 'none',
                }}
              >
                {/* Tooltip */}
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md border border-cyan-500/15 bg-[#0a0f1a]/90 backdrop-blur-sm px-2 py-0.5 text-[9px] text-cyan-300 opacity-0 transition-opacity group-hover:opacity-100">
                  {point}%
                </div>
              </motion.div>
            ))}
          </div>
          <p className="mt-3 text-[11px] text-slate-600">
            Frame-by-frame anomaly confidence progression across the analyzed sample.
          </p>
        </div>
      </section>
    </div>
  );
}
