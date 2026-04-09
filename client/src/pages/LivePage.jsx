import { RadioTower } from 'lucide-react';
import PageTransition from '../components/PageTransition';
import LiveDetectionPanel from '../components/LiveDetectionPanel';

export default function LivePage() {
  return (
    <PageTransition className="space-y-8 py-10">
      <section className="text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.2em] text-brand-cyan">
          <RadioTower className="h-3.5 w-3.5" />
          Live Stream Detection
        </div>
        <h1 className="mt-4 font-display text-4xl font-semibold text-white">Zoom/Meet-Style Real-Time Deepfake Monitoring</h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-300 md:text-base">
          Simulate participant streams, monitor voice waveform activity, and track a continuously updated risk score.
        </p>
      </section>

      <LiveDetectionPanel />
    </PageTransition>
  );
}
