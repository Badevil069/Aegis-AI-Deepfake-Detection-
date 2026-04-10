import { RadioTower, Shield, Cpu, Wifi } from 'lucide-react';
import PageTransition from '../components/PageTransition';
import LiveDetectionHub from '../components/live/LiveDetectionHub';

export default function LivePage() {
  return (
    <PageTransition className="space-y-6 py-8 md:py-12">
      {/* Page header */}
      <section className="text-center">
        <div className="mb-3 flex justify-center">
          <span className="cyber-badge cyber-badge-glow">
            <RadioTower className="h-3 w-3" />
            Real-Time Detection
          </span>
        </div>
        <h1 className="font-display text-4xl font-bold text-white md:text-5xl">
          Live <span className="glow-text">Deepfake Monitoring</span>
        </h1>
        <p className="mx-auto mt-4 max-w-3xl text-base text-slate-400">
          Real-time multimodal detection across webcam, live streams, and WebRTC video calls.
          All analysis uses production-grade computer vision — no simulated data.
        </p>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-600">
          <span className="inline-flex items-center gap-1.5">
            <Shield className="h-3 w-3 text-brand-cyan/50" />
            End-to-end encrypted
          </span>
          <span className="h-3 w-px bg-slate-700" />
          <span className="inline-flex items-center gap-1.5">
            <Cpu className="h-3 w-3 text-brand-cyan/50" />
            OpenCV + Vertex AI
          </span>
          <span className="h-3 w-px bg-slate-700" />
          <span className="inline-flex items-center gap-1.5">
            <Wifi className="h-3 w-3 text-brand-cyan/50" />
            WebSocket real-time
          </span>
        </div>
      </section>

      {/* Detection hub (all 3 modes) */}
      <LiveDetectionHub />
    </PageTransition>
  );
}
