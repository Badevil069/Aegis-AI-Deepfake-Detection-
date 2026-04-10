import { motion } from 'framer-motion';

export default function InfoCard({ icon: Icon, title, description, tag, index = 0 }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ delay: index * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -6, scale: 1.01 }}
      className="glass-card group relative overflow-hidden p-6 md:p-7"
    >
      {/* Subtle glow on hover */}
      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-brand-cyan/0 blur-2xl transition-all duration-500 group-hover:bg-brand-cyan/10" />

      {tag && (
        <div className="cyber-badge mb-4">
          {tag}
        </div>
      )}

      <div className="relative mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-indigo/25 to-brand-cyan/10 text-brand-cyan transition-all duration-300 group-hover:shadow-neon-cyan">
        <Icon className="h-5 w-5" strokeWidth={1.8} />
        <div className="absolute inset-0 rounded-xl border border-brand-cyan/0 transition-all duration-300 group-hover:border-brand-cyan/20" />
      </div>

      <h3 className="mb-2 text-xl font-semibold text-white">{title}</h3>
      <p className="text-sm leading-relaxed text-slate-400">{description}</p>
    </motion.article>
  );
}
