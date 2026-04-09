import { motion } from 'framer-motion';

export default function InfoCard({ icon: Icon, title, description, tag }) {
  return (
    <motion.article
      whileHover={{ y: -6, scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 220, damping: 18 }}
      className="glass-card group p-6 md:p-7"
    >
      <div className="mb-4 inline-flex items-center rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-brand-cyan/90">
        {tag || 'Module'}
      </div>
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-indigo/20 text-brand-cyan shadow-soft-glow">
        <Icon className="h-5 w-5" strokeWidth={1.8} />
      </div>
      <h3 className="mb-2 text-xl font-semibold text-white">{title}</h3>
      <p className="text-sm leading-relaxed text-slate-300">{description}</p>
    </motion.article>
  );
}
