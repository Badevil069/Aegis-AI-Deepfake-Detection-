import { motion } from 'framer-motion';
import { Camera, Cpu, FileCheck2, Radar, ArrowRight } from 'lucide-react';
import PageTransition from '../components/PageTransition';
import InfoCard from '../components/InfoCard';
import { howItWorksSteps } from '../data/mockData';
import FantasyBackground from '../components/FantasyBackground';

const icons = [Camera, Cpu, Radar, FileCheck2];

const pipelineSteps = [
  { label: 'Input', color: 'from-cyan-500 to-blue-500' },
  { label: 'Analysis', color: 'from-blue-500 to-indigo-500' },
  { label: 'Detection', color: 'from-indigo-500 to-violet-500' },
  { label: 'Output', color: 'from-violet-500 to-fuchsia-500' },
];

export default function HowItWorksPage() {
  return (
    <PageTransition className="space-y-14 pt-28 pb-12">
      {/* Mesh background glow */}
      <div className="pointer-events-none fixed inset-0 z-0 mesh-bg opacity-40" />
      <FantasyBackground />

      {/* Header */}
      <section className="relative z-10 text-center">
        <div className="mb-3 flex justify-center">
          <span className="cyber-badge cyber-badge-glow">How It Works</span>
        </div>
        <h1 className="font-display text-4xl font-bold text-white md:text-5xl deepshield-glow-text">
          AI-Driven <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Detection Pipeline</span>
        </h1>
        <p className="mx-auto mt-4 max-w-3xl text-base text-slate-400">
          The platform combines visual, acoustic, and temporal forensics to estimate deepfake likelihood and provide actionable confidence-based reports.
        </p>
      </section>

      {/* Pipeline visual */}
      <section className="relative z-10 hidden md:block">
        <div className="deepshield-feature-card p-8">
          <p className="mb-6 text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
            Detection Pipeline Flow
          </p>
          <div className="flex items-center justify-between gap-2">
            {pipelineSteps.map((step, idx) => (
              <div key={step.label} className="flex items-center gap-2 flex-1">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.15, duration: 0.4 }}
                  className="flex flex-col items-center gap-2 flex-1"
                >
                  <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${step.color} bg-opacity-20 shadow-[0_0_15px_rgba(0,242,255,0.1)]`}>
                    {(() => {
                      const Icon = icons[idx];
                      return <Icon className="h-6 w-6 text-white" strokeWidth={1.5} />;
                    })()}
                  </div>
                  <span className="text-xs font-semibold text-white">{step.label}</span>
                  <span className="text-[10px] text-slate-500">Step {String(idx + 1).padStart(2, '0')}</span>
                </motion.div>
                {idx < pipelineSteps.length - 1 && (
                  <motion.div
                    initial={{ opacity: 0, scaleX: 0 }}
                    whileInView={{ opacity: 1, scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.15 + 0.1, duration: 0.3 }}
                    className="mb-6"
                  >
                    <ArrowRight className="h-5 w-5 text-cyan-400/40" />
                  </motion.div>
                )}
              </div>
            ))}
          </div>

          {/* Connectors */}
          <div className="mt-6 h-1 w-full rounded-full bg-white/4 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: '100%' }}
              viewport={{ once: true }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-violet-500"
            />
          </div>
        </div>
      </section>

      {/* Step cards */}
      <section className="relative z-10 grid gap-5 md:grid-cols-2">
        {howItWorksSteps.map((step, idx) => (
          <InfoCard
            key={step.title}
            icon={icons[idx % icons.length]}
            title={step.title}
            description={step.description}
            tag={`Step 0${idx + 1}`}
            index={idx}
          />
        ))}
      </section>

      {/* Technical specs */}
      <section className="relative z-10 deepshield-feature-card p-6">
        <h2 className="text-xl font-semibold text-white mb-5 deepshield-glow-text">Technical Specifications</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { label: 'Detection Models', value: 'EfficientNet-B4, LSTM-Attention, WavLM', desc: 'Multi-architecture ensemble' },
            { label: 'Processing Speed', value: '< 6.4 seconds', desc: 'Average end-to-end latency' },
            { label: 'Supported Formats', value: 'MP4, AVI, MP3, WAV, JPG, PNG', desc: 'Cross-modal input support' },
          ].map((spec) => (
            <div key={spec.label} className="rounded-xl border border-cyan-500/10 bg-black/30 p-4 hover:border-cyan-500/30 transition-colors">
              <p className="text-[10px] uppercase tracking-[0.18em] text-cyan-400/60">{spec.label}</p>
              <p className="mt-2 text-lg font-semibold text-white">{spec.value}</p>
              <p className="mt-1 text-xs text-slate-500">{spec.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </PageTransition>
  );
}
