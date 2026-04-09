import { Camera, Cpu, Radar, FileCheck2 } from 'lucide-react';
import PageTransition from '../components/PageTransition';
import InfoCard from '../components/InfoCard';
import { howItWorksSteps } from '../data/mockData';

const icons = [Camera, Cpu, Radar, FileCheck2];

export default function HowItWorksPage() {
  return (
    <PageTransition className="space-y-10 py-10">
      <section className="text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-brand-cyan">How It Works</p>
        <h1 className="mt-3 font-display text-4xl font-semibold text-white">AI-Driven Detection Pipeline</h1>
        <p className="mx-auto mt-3 max-w-3xl text-sm text-slate-300 md:text-base">
          The platform combines visual, acoustic, and temporal forensics to estimate deepfake likelihood and provide actionable confidence-based reports.
        </p>
      </section>

      <section className="grid gap-5 md:grid-cols-2">
        {howItWorksSteps.map((step, idx) => (
          <InfoCard
            key={step.title}
            icon={icons[idx % icons.length]}
            title={step.title}
            description={step.description}
            tag={`Step 0${idx + 1}`}
          />
        ))}
      </section>
    </PageTransition>
  );
}
