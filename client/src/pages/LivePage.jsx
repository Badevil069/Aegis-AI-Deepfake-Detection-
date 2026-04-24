import { RadioTower, Shield, Cpu, Wifi } from 'lucide-react';
import PageTransition from '../components/PageTransition';
import LiveDetectionHub from '../components/live/LiveDetectionHub';

export default function LivePage() {
  return (
    <PageTransition className="space-y-6 py-8 md:py-12">
      {/* Mesh background glow */}
      <div className="pointer-events-none fixed inset-0 z-0 mesh-bg opacity-40" />

      {/* Page header */}
      <section className="relative z-10 text-center">
        <div className="mb-3 flex justify-center">
          <span className="cyber-badge cyber-badge-glow">
            <RadioTower className="h-3 w-3" />
            Real-Time Detection
          </span>
        </div>
        <h1 className="font-display text-4xl font-bold text-white md:text-5xl deepshield-glow-text">
          Live <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Deepfake Monitoring</span>
        </h1>
        <p className="mx-auto mt-4 max-w-3xl text-base text-slate-400">
          Real-time multimodal detection across webcam, live streams, and WebRTC video calls.
          All analysis uses production-grade computer vision — no simulated data.
        </p>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-600">
          <span className="inline-flex items-center gap-1.5">
            <Shield className="h-3 w-3 text-cyan-400/50" />
            End-to-end encrypted
          </span>
          <span className="h-3 w-px bg-slate-700" />
          <span className="inline-flex items-center gap-1.5">
            <Cpu className="h-3 w-3 text-cyan-400/50" />
            OpenCV + Vertex AI
          </span>
          <span className="h-3 w-px bg-slate-700" />
          <span className="inline-flex items-center gap-1.5">
            <Wifi className="h-3 w-3 text-cyan-400/50" />
            WebSocket real-time
          </span>
        </div>
      </section>

      {/* Detection hub (all 3 modes) */}
      <div className="relative z-10">
        <LiveDetectionHub />
      </div>
    </PageTransition>
  );
}
