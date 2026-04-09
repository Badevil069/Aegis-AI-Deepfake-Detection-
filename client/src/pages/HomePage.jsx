import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  BadgeDollarSign,
  Camera,
  Newspaper,
  Scale,
  Share2,
  Sparkles,
  Waypoints,
} from 'lucide-react';
import HeroSection from '../components/HeroSection';
import InfoCard from '../components/InfoCard';
import PageTransition from '../components/PageTransition';
import { homeStats, howItWorksSteps, useCases } from '../data/mockData';

const stepIcons = [Camera, Waypoints, Sparkles];
const useCaseIcons = [Newspaper, BadgeDollarSign, Share2, Scale];

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <PageTransition className="space-y-14 pb-14 pt-8 md:space-y-20 md:pt-10">
      <HeroSection />

      <section className="grid gap-6 lg:grid-cols-12">
        <div className="glass-card p-6 lg:col-span-8">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Threat Intelligence Snapshot</h2>
            <span className="rounded-full border border-brand-cyan/35 bg-brand-cyan/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-brand-cyan">
              Live Preview
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {homeStats.map((stat) => (
              <div key={stat.label} className="rounded-xl border border-white/10 bg-black/25 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{stat.label}</p>
                <p className="mt-2 text-2xl font-semibold text-white">{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-xl border border-white/10 bg-black/25 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Anomaly Trend (Mock Data)</p>
            <div className="mt-3 flex h-24 items-end gap-2">
              {[12, 32, 28, 44, 57, 35, 68, 49, 73, 61, 40, 58].map((value, idx) => (
                <motion.div
                  key={idx}
                  initial={{ height: 0 }}
                  whileInView={{ height: `${value}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: idx * 0.03 }}
                  className="flex-1 rounded-t bg-gradient-to-t from-brand-indigo to-brand-cyan"
                />
              ))}
            </div>
          </div>
        </div>

        <div className="glass-card flex flex-col justify-between p-6 lg:col-span-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-brand-cyan">Multimodal Coverage</p>
            <h3 className="mt-3 text-2xl font-semibold text-white">Video, Image, Voice, and Live Streams</h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              Analyze uploaded files or run real-time deepfake detection in Zoom/Meet-style sessions with risk telemetry.
            </p>
          </div>

          <button className="cyber-button mt-6 py-3 text-sm" onClick={() => navigate('/detect')}>
            Launch Detection Workspace
          </button>
        </div>
      </section>

      <section>
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-brand-cyan">How It Works</p>
            <h2 className="mt-2 text-3xl font-semibold text-white">Forensic Pipeline in 3 Steps</h2>
          </div>
          <button
            className="rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:border-brand-cyan/70 hover:text-white"
            onClick={() => navigate('/how-it-works')}
          >
            View Full Breakdown
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {howItWorksSteps.slice(0, 3).map((step, index) => (
            <InfoCard
              key={step.title}
              icon={stepIcons[index]}
              title={step.title}
              description={step.description}
              tag={`Step 0${index + 1}`}
            />
          ))}
        </div>
      </section>

      <section>
        <div className="mb-6">
          <p className="text-xs uppercase tracking-[0.2em] text-brand-cyan">Use Cases</p>
          <h2 className="mt-2 text-3xl font-semibold text-white">Built for High-Stakes Verification</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {useCases.map((item, index) => {
            const Icon = useCaseIcons[index % useCaseIcons.length];
            return (
              <div key={item.title} className="glass-card p-5 transition hover:-translate-y-1">
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-indigo/20 text-brand-cyan">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                <p className="mt-2 text-sm text-slate-300">{item.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="glass-card relative overflow-hidden p-8 text-center">
        <div className="pointer-events-none absolute left-1/3 top-0 h-32 w-32 -translate-y-1/2 rounded-full bg-brand-cyan/20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 right-1/4 h-32 w-32 translate-y-1/2 rounded-full bg-brand-violet/20 blur-3xl" />

        <h2 className="text-3xl font-semibold text-white">Ready to secure your media pipeline?</h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-300 md:text-base">
          Start with upload-based analysis or open a live detection room to monitor suspicious streams in real time.
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button className="cyber-button px-5 py-3 text-sm" onClick={() => navigate('/detect')}>
            Upload Media
          </button>
          <button
            className="rounded-xl border border-white/20 bg-white/5 px-5 py-3 text-sm text-slate-200 transition hover:border-brand-cyan/70 hover:text-white"
            onClick={() => navigate('/live')}
          >
            Try Live Detection
          </button>
        </div>
      </section>
    </PageTransition>
  );
}
