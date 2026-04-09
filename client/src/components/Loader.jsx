import { motion } from 'framer-motion';
import { Cpu } from 'lucide-react';

export default function Loader({ progress, statusText }) {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.14),transparent_40%),radial-gradient(circle_at_80%_80%,rgba(139,92,246,0.2),transparent_45%)]" />

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35 }}
        className="glass-card relative z-10 w-full max-w-xl p-8 text-center"
      >
        <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-indigo/30 text-brand-cyan shadow-soft-glow">
          <Cpu className="h-7 w-7" />
        </div>

        <h1 className="mt-5 font-display text-3xl font-semibold text-white">Processing Detection</h1>
        <p className="mt-2 text-sm text-slate-300">{statusText}</p>

        <div className="mt-7 h-3 overflow-hidden rounded-full bg-white/10">
          <motion.div
            animate={{ width: `${progress}%` }}
            transition={{ ease: 'easeOut', duration: 0.4 }}
            className="h-full bg-gradient-to-r from-brand-cyan via-brand-indigo to-brand-violet"
          />
        </div>

        <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
          <span>Neural scan in progress...</span>
          <span>{progress}%</span>
        </div>
      </motion.div>
    </section>
  );
}
