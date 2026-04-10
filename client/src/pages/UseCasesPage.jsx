import { motion } from 'framer-motion';
import {
  BadgeDollarSign,
  Building2,
  CheckCircle2,
  Megaphone,
  Newspaper,
  Scale,
  Shield,
} from 'lucide-react';
import PageTransition from '../components/PageTransition';
import { useCases } from '../data/mockData';

const icons = [Newspaper, BadgeDollarSign, Megaphone, Scale];

const extendedUseCases = [
  ...useCases,
  {
    title: 'Government & Defense',
    description: 'Verify authenticity of intelligence materials, official communications, and public-facing media.',
  },
  {
    title: 'Healthcare Compliance',
    description: 'Validate patient identity in telemedicine and prevent synthetic media in insurance claims.',
  },
];

const extendedIcons = [Newspaper, BadgeDollarSign, Megaphone, Scale, Shield, Building2];

const highlights = [
  { icon: CheckCircle2, text: 'Cross-platform media validation' },
  { icon: CheckCircle2, text: 'Synthetic speech anomaly detection' },
  { icon: CheckCircle2, text: 'Evidence-ready timeline summaries' },
  { icon: CheckCircle2, text: 'Scalable moderation operations' },
  { icon: CheckCircle2, text: 'API-first enterprise integration' },
  { icon: CheckCircle2, text: 'SOC 2 & GDPR compliant infrastructure' },
];

export default function UseCasesPage() {
  return (
    <PageTransition className="space-y-14 py-12">
      {/* Header */}
      <section className="text-center">
        <div className="mb-3 flex justify-center">
          <span className="cyber-badge cyber-badge-glow">Use Cases</span>
        </div>
        <h1 className="font-display text-4xl font-bold text-white md:text-5xl">
          Applied Deepfake <span className="glow-text">Defense</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-slate-400">
          Aegis Sentinel supports multiple teams that require trusted media authenticity in real-time and post-event investigations.
        </p>
      </section>

      {/* Use case grid */}
      <section className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {extendedUseCases.map((item, idx) => {
          const Icon = extendedIcons[idx % extendedIcons.length];
          return (
            <motion.article
              key={item.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-30px' }}
              transition={{ delay: idx * 0.08, duration: 0.4 }}
              whileHover={{ y: -6 }}
              className="glass-card group relative overflow-hidden rounded-2xl p-6"
            >
              {/* Hover glow */}
              <div className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-brand-cyan/0 blur-2xl transition-all duration-500 group-hover:bg-brand-cyan/10" />

              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-indigo/20 to-brand-cyan/10 text-brand-cyan transition-all duration-300 group-hover:shadow-neon-cyan">
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-semibold text-white">{item.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-400">{item.description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1 text-[10px] text-slate-500">
                  Enterprise Ready
                </span>
                <span className="rounded-full border border-brand-cyan/20 bg-brand-cyan/5 px-3 py-1 text-[10px] text-brand-cyan">
                  Multimodal
                </span>
              </div>
            </motion.article>
          );
        })}
      </section>

      {/* Why teams choose us */}
      <section className="glass-card p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white">Why Teams Choose This Platform</h2>
          <p className="mt-2 text-sm text-slate-500">Built for scale, security, and compliance</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {highlights.map(({ icon: Icon, text }) => (
            <motion.div
              key={text}
              initial={{ opacity: 0, x: -8 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-3 rounded-xl border border-white/6 bg-black/15 px-4 py-3 text-sm text-slate-300"
            >
              <Icon className="h-4 w-4 shrink-0 text-brand-cyan/60" />
              {text}
            </motion.div>
          ))}
        </div>
      </section>
    </PageTransition>
  );
}
