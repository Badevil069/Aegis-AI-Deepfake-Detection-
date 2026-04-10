import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Home } from 'lucide-react';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="relative flex min-h-[70vh] items-center justify-center px-4">
      <div className="grid-bg pointer-events-none absolute inset-0 opacity-30" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 text-center"
      >
        <div className="mx-auto mb-6 inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-brand-indigo/20 to-brand-violet/10">
          <AlertCircle className="h-10 w-10 text-brand-cyan/60" strokeWidth={1.2} />
        </div>

        <h1 className="font-display text-6xl font-bold text-white md:text-8xl">
          4<span className="glow-text">0</span>4
        </h1>
        <p className="mt-4 text-lg text-slate-400">
          This sector of the platform doesn't exist.
        </p>
        <p className="mt-2 text-sm text-slate-600">
          The page you're looking for might have been moved or doesn't exist.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            className="cyber-button inline-flex items-center gap-2 px-5 py-3 text-sm"
            onClick={() => navigate('/')}
          >
            <Home className="h-4 w-4" />
            <span>Back to Home</span>
          </button>
          <button
            className="ghost-button inline-flex items-center gap-2 px-5 py-3 text-sm"
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
