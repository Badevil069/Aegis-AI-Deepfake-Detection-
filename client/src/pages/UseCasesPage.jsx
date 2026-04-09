import { motion } from 'framer-motion';
import { BadgeDollarSign, Megaphone, Newspaper, Scale } from 'lucide-react';
import PageTransition from '../components/PageTransition';
import { useCases } from '../data/mockData';

const icons = [Newspaper, BadgeDollarSign, Megaphone, Scale];

const highlights = [
  'Cross-platform media validation',
  'Synthetic speech anomaly detection',
  'Evidence-ready timeline summaries',
  'Scalable moderation operations',
];

export default function UseCasesPage() {
  return (
    <PageTransition className="space-y-10 py-10">
      <section className="text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-brand-cyan">Use Cases</p>
        <h1 className="mt-3 font-display text-4xl font-semibold text-white">Applied Deepfake Defense</h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-300 md:text-base">
          Aegis Sentinel supports multiple teams that require trusted media authenticity in real-time and post-event investigations.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {useCases.map((item, idx) => {
          const Icon = icons[idx % icons.length];
          return (
            <motion.article
              key={item.title}
              whileHover={{ y: -6 }}
              className="glass-card rounded-2xl p-6"
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-indigo/20 text-brand-cyan">
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="text-2xl font-semibold text-white">{item.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-300">{item.description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-slate-300">
                  Enterprise Ready
                </span>
                <span className="rounded-full border border-brand-cyan/40 bg-brand-cyan/10 px-3 py-1 text-xs text-brand-cyan">
                  Multimodal
                </span>
              </div>
            </motion.article>
          );
        })}
      </section>

      <section className="glass-card p-6">
        <h2 className="text-xl font-semibold text-white">Why Teams Choose This Platform</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {highlights.map((item) => (
            <div key={item} className="rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-slate-200">
              {item}
            </div>
          ))}
        </div>
      </section>
    </PageTransition>
  );
}
