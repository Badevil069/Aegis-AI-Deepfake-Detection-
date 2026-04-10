import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BadgeDollarSign,
  Brain,
  Camera,
  Globe,
  Newspaper,
  Scale,
  Share2,
  Shield,
  Sparkles,
  Waypoints,
  Zap,
} from 'lucide-react';
import HeroSection from '../components/HeroSection';
import InfoCard from '../components/InfoCard';
import PageTransition from '../components/PageTransition';
import { homeStats, howItWorksSteps, useCases } from '../data/mockData';

const stepIcons = [Camera, Waypoints, Sparkles];
const useCaseIcons = [Newspaper, BadgeDollarSign, Share2, Scale];

const features = [
  {
    icon: Brain,
    title: 'AI-Powered Detection',
    description: 'Neural networks trained on millions of deepfake samples for unmatched accuracy across all media types.',
  },
  {
    icon: Zap,
    title: 'Real-Time Analysis',
    description: 'Process live streams, video calls, and uploaded media in under 6 seconds with streaming telemetry.',
  },
  {
    icon: Shield,
    title: 'Explainable Results',
    description: 'Every detection comes with forensic insights, confidence scores, and actionable remediation steps.',
  },
];

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <PageTransition className="space-y-16 pb-16 pt-8 md:space-y-24 md:pt-10">
      {/* Hero */}
      <HeroSection />

      {/* Stats + Multimodal */}
      <section className="grid gap-6 lg:grid-cols-12">
        <div className="glass-card p-6 lg:col-span-8">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Threat Intelligence Snapshot</h2>
            <span className="cyber-badge cyber-badge-glow text-[9px]">
              <div className="pulse-dot" style={{ width: 6, height: 6 }} />
              Live Preview
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {homeStats.map((stat, idx) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.08, duration: 0.4 }}
                className="rounded-xl border border-white/6 bg-black/20 p-4 transition-all duration-300 hover:border-white/12"
              >
                <p className="text-[10px] uppercase tracking-[0.18em] text-slate-600">{stat.label}</p>
                <p className="mt-2 text-2xl font-bold text-white">{stat.value}</p>
              </motion.div>
            ))}
          </div>

          {/* Anomaly chart */}
          <div className="mt-5 rounded-xl border border-white/6 bg-black/20 p-4">
            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-600">Anomaly Detection Trend</p>
            <div className="mt-3 flex h-28 items-end gap-1.5">
              {[12, 32, 28, 44, 57, 35, 68, 49, 73, 61, 40, 58, 65, 42, 78].map((value, idx) => (
                <motion.div
                  key={idx}
                  initial={{ height: 0 }}
                  whileInView={{ height: `${value}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: idx * 0.03 }}
                  className="flex-1 rounded-t bg-gradient-to-t from-brand-indigo/70 to-brand-cyan/50 transition-all duration-300 hover:from-brand-indigo hover:to-brand-cyan cursor-pointer"
                />
              ))}
            </div>
          </div>
        </div>

        <div className="glass-card flex flex-col justify-between p-6 lg:col-span-4">
          <div>
            <div className="cyber-badge mb-4">
              <Globe className="h-3 w-3" />
              Multimodal Coverage
            </div>
            <h3 className="text-2xl font-bold text-white">Video, Image, Voice & Live Streams</h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              Analyze uploaded files or run real-time deepfake detection in Zoom/Meet-style sessions with continuous risk telemetry.
            </p>
          </div>

          <button className="cyber-button mt-6 inline-flex items-center justify-center gap-2 py-3.5 text-sm" onClick={() => navigate('/detect')}>
            <span>Launch Detection Workspace</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>

      {/* Key Features */}
      <section>
        <div className="mb-8 text-center">
          <div className="mb-3 flex justify-center"><span className="cyber-badge">Key Features</span></div>
          <h2 className="font-display text-3xl font-bold text-white md:text-4xl">
            Why Choose <span className="glow-text">Aegis Sentinel</span>
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-400">
            Enterprise-ready deepfake defense with unmatched accuracy, speed, and explainability.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {features.map((feature, index) => (
            <InfoCard
              key={feature.title}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              index={index}
            />
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section>
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="cyber-badge mb-3">How It Works</div>
            <h2 className="font-display text-3xl font-bold text-white md:text-4xl">
              Forensic Pipeline in 3 Steps
            </h2>
          </div>
          <button
            className="ghost-button px-4 py-2.5 text-sm"
            onClick={() => navigate('/how-it-works')}
          >
            View Full Breakdown
          </button>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {howItWorksSteps.slice(0, 3).map((step, index) => (
            <InfoCard
              key={step.title}
              icon={stepIcons[index]}
              title={step.title}
              description={step.description}
              tag={`Step 0${index + 1}`}
              index={index}
            />
          ))}
        </div>
      </section>

      {/* Use Cases */}
      <section>
        <div className="mb-8 text-center">
          <div className="mb-3 flex justify-center"><span className="cyber-badge">Use Cases</span></div>
          <h2 className="font-display text-3xl font-bold text-white md:text-4xl">
            Built for High-Stakes Verification
          </h2>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {useCases.map((item, index) => {
            const Icon = useCaseIcons[index % useCaseIcons.length];
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-30px' }}
                transition={{ delay: index * 0.08, duration: 0.4 }}
                className="glass-card group p-5 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-indigo/20 to-brand-cyan/10 text-brand-cyan transition-all duration-300 group-hover:shadow-neon-cyan">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{item.description}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Final CTA */}
      <section className="glass-card-elevated relative overflow-hidden p-10 text-center md:p-14">
        {/* Glow effects */}
        <div className="pointer-events-none absolute left-1/3 top-0 h-40 w-40 -translate-y-1/2 rounded-full bg-brand-cyan/15 blur-[60px]" />
        <div className="pointer-events-none absolute bottom-0 right-1/4 h-40 w-40 translate-y-1/2 rounded-full bg-brand-violet/15 blur-[60px]" />

        <div className="relative z-10">
          <h2 className="font-display text-3xl font-bold text-white md:text-4xl">
            Ready to secure your <span className="glow-text">media pipeline</span>?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-slate-400 md:text-base">
            Start with upload-based analysis or open a live detection room to monitor suspicious streams in real time.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button className="cyber-button inline-flex items-center gap-2 px-6 py-3.5 text-sm" onClick={() => navigate('/detect')}>
              <span>Upload Media</span>
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              className="ghost-button inline-flex items-center gap-2 px-6 py-3.5 text-sm"
              onClick={() => navigate('/live')}
            >
              Try Live Detection
            </button>
          </div>
        </div>
      </section>
    </PageTransition>
  );
}
