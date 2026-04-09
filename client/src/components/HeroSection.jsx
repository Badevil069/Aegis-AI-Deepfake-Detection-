import { motion } from 'framer-motion';
import { ArrowRight, PlayCircle, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.04] via-brand-indigo/10 to-brand-cyan/5 px-6 py-16 shadow-soft-xl md:px-10 md:py-20">
      <div className="pointer-events-none absolute -left-24 top-10 h-56 w-56 rounded-full bg-brand-cyan/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-56 w-56 rounded-full bg-brand-violet/20 blur-3xl" />

      <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-start gap-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.22em] text-brand-cyan"
        >
          <ShieldAlert className="h-4 w-4" />
          AI Cybersecurity Platform
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.55 }}
          className="max-w-3xl font-display text-4xl font-semibold leading-tight text-white md:text-6xl"
        >
          Detect Deepfakes Instantly
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="max-w-2xl text-base leading-relaxed text-slate-300 md:text-lg"
        >
          Protect investigations, moderation pipelines, and critical communication channels with multimodal AI detection for image, video, voice, and live calls.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.45 }}
          className="flex flex-wrap items-center gap-3"
        >
          <button className="cyber-button inline-flex items-center gap-2 px-5 py-3" onClick={() => navigate('/detect')}>
            Upload Media
            <ArrowRight className="h-4 w-4" />
          </button>
          <button
            className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-5 py-3 text-sm font-medium text-slate-100 transition hover:border-brand-cyan/70 hover:bg-brand-cyan/10"
            onClick={() => navigate('/live')}
          >
            <PlayCircle className="h-4 w-4" />
            Try Live Detection
          </button>
        </motion.div>
      </div>
    </section>
  );
}
