import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Link2, Loader2, Play, Square, AlertCircle } from 'lucide-react';

/**
 * StreamMode — live stream URL analysis.
 * Sends URL to backend which uses yt-dlp + FFmpeg to extract frames.
 * Results stream back via Socket.IO.
 */
export default function StreamMode({ startStream, stopStream, streamStatus, streamSessionId, addLog }) {
  const [url, setUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const startDetection = useCallback(async () => {
    if (!url.trim()) {
      addLog?.('warning', 'Please enter a valid stream URL.');
      return;
    }

    setIsRunning(true);
    addLog?.('info', `Initiating stream analysis: ${url}`);
    const result = await startStream(url.trim());
    if (!result || result.error) {
      setIsRunning(false);
      addLog?.('error', result?.error || 'Failed to start stream.');
    }
  }, [url, startStream, addLog]);

  const stopDetection = useCallback(async () => {
    await stopStream();
    setIsRunning(false);
  }, [stopStream]);

  // Determine stream phase from status
  const phase = streamStatus?.status || 'idle';
  const phaseLabel = {
    idle: 'Ready',
    resolving: 'Resolving URL...',
    connecting: 'Connecting to stream...',
    processing: 'Connecting to stream...',
    analyzing: 'Analyzing frames...',
    live: 'Analyzing frames...',
    error: 'Error',
    stopped: 'Stopped',
  }[phase] || phase;

  return (
    <div className="space-y-3">
      {/* URL Input Card */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="h-4 w-4 text-brand-cyan/70" />
          <h3 className="text-sm font-semibold text-white">Stream URL Input</h3>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Link2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste YouTube, Twitch, or HLS stream URL..."
              className="cyber-input pl-10"
            disabled={isRunning}
            />
          </div>
          {isRunning ? (
            <button
              onClick={stopDetection}
              className="inline-flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-5 py-2.5 text-sm font-medium text-rose-300 transition hover:bg-rose-500/20"
            >
              <Square className="h-4 w-4" />
              Stop
            </button>
          ) : (
            <button
              onClick={startDetection}
              disabled={!url.trim()}
              className="cyber-button inline-flex items-center gap-2 px-5 py-2.5 text-sm disabled:opacity-40"
            >
              <Play className="h-4 w-4" />
              Analyze
            </button>
          )}
        </div>

        {/* Supported formats hint */}
        <p className="mt-3 text-[10px] text-slate-600">
          Supported: YouTube, Twitch, Facebook Live, HLS (.m3u8), DASH, and 1000+ sites via yt-dlp
        </p>
      </div>

      {/* Stream Status Card */}
      <div className="glass-card relative overflow-hidden p-5">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
            Stream Status
          </span>
          {streamSessionId && (
            <span className="font-mono text-[10px] text-slate-600">
              Session: {streamSessionId}
            </span>
          )}
        </div>

        {/* Phase indicator */}
        <div className="flex items-center gap-3 rounded-xl border border-white/6 bg-black/20 px-4 py-3">
          <AnimatePresence mode="wait">
            {(phase === 'resolving' || phase === 'connecting' || phase === 'analyzing') ? (
              <motion.div key="spinning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Loader2 className="h-5 w-5 text-brand-cyan animate-spin" />
              </motion.div>
            ) : phase === 'error' ? (
              <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <AlertCircle className="h-5 w-5 text-rose-400" />
              </motion.div>
            ) : (
              <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Globe className="h-5 w-5 text-slate-500" />
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            <p className="text-sm font-medium text-white">{phaseLabel}</p>
            {streamStatus?.message && (
              <p className="mt-0.5 text-xs text-slate-500">{streamStatus.message}</p>
            )}
          </div>
        </div>

        {/* Processing pipeline visualization */}
        {isRunning && (
          <div className="mt-4 flex items-center gap-2">
            {['yt-dlp', 'FFmpeg', 'CV Engine', 'Results'].map((step, idx) => {
              const activeIdx = {
                resolving: 0,
                extracting: 0,
                connecting: 1,
                processing: 1,
                analyzing: 2,
                live: 2,
              }[phase] ?? 3;
              const isActive = idx <= activeIdx;
              return (
                <div key={step} className="flex items-center gap-2 flex-1">
                  <div className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${isActive ? 'bg-gradient-to-r from-brand-cyan to-brand-indigo' : 'bg-white/6'}`} />
                  <span className={`text-[9px] shrink-0 ${isActive ? 'text-brand-cyan' : 'text-slate-600'}`}>{step}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Stream preview area */}
      <div className="glass-card relative overflow-hidden p-3">
        <div className="aspect-video w-full overflow-hidden rounded-2xl border border-white/8 bg-gradient-to-br from-slate-900 via-slate-950 to-black">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(56,189,248,0.08),transparent_55%)]" />

          <div className="flex h-full flex-col items-center justify-center gap-4">
            {isRunning ? (
              <>
                <motion.div
                  animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Globe className="h-12 w-12 text-brand-cyan/40" strokeWidth={1} />
                </motion.div>
                <p className="text-sm text-slate-400">Analyzing stream frames...</p>
                <p className="text-[10px] text-slate-600">
                  Frames are processed server-side. Results appear in the sidebar timeline.
                </p>
              </>
            ) : (
              <>
                <Globe className="h-12 w-12 text-slate-700" strokeWidth={1} />
                <p className="text-sm text-slate-500">Paste a stream URL and click Analyze to begin</p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
