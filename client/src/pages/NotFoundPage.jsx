import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Home } from 'lucide-react';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="relative flex min-h-[70vh] items-center justify-center px-4">
      {/* Mesh background */}
      <div className="pointer-events-none absolute inset-0 mesh-bg opacity-40" />
      <div className="pointer-events-none absolute inset-0 neural-grid-bg opacity-20" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 text-center"
      >
        <div className="mx-auto mb-6 inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-cyan-500/20 to-blue-500/10 shadow-[0_0_30px_rgba(0,242,255,0.1)]">
          <AlertCircle className="h-10 w-10 text-cyan-400/60" strokeWidth={1.2} />
        </div>

        <h1 className="font-display text-6xl font-bold text-white md:text-8xl deepshield-glow-text">
          4<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">0</span>4
        </h1>
        <p className="mt-4 text-lg text-slate-400">
          This sector of the platform doesn't exist.
        </p>
        <p className="mt-2 text-sm text-slate-600">
          The page you're looking for might have been moved or doesn't exist.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            className="deepshield-btn-primary inline-flex items-center gap-2 px-5 py-3 text-sm interactive"
            onClick={() => navigate('/')}
          >
            <Home className="h-4 w-4" />
            <span>Back to Home</span>
          </button>
          <button
            className="deepshield-btn-secondary inline-flex items-center gap-2 px-5 py-3 text-sm interactive"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Go Back</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
