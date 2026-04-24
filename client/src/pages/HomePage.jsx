import { useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import PageTransition from '../components/PageTransition';
import CyberGlobe from '../components/CyberGlobe';

/* ─── Feature card data ─── */
const features = [
  {
    icon: 'videocam',
    title: 'Video Analysis',
    description: 'Frame-by-frame spatial and temporal artifact detection to identify synthetic manipulation and face-swaps.',
    delay: 0,
  },
  {
    icon: 'image',
    title: 'Image Forgery',
    description: 'Deep pixel-level analysis to uncover GAN-generated faces, inpainting, and structural inconsistencies.',
    delay: 100,
  },
  {
    icon: 'mic',
    title: 'Voice Cloning',
    description: 'Spectrogram analysis identifying unnatural breathing patterns and synthetic voice generation anomalies.',
    delay: 200,
  },
  {
    icon: 'stream',
    title: 'Live Stream',
    description: 'Sub-second latency detection for live video conferencing and streaming platforms to prevent real-time fraud.',
    delay: 300,
  },
  {
    icon: 'phishing',
    title: 'Phishing Prevention',
    description: 'Identify socially engineered deepfake campaigns targeting employees through email or messaging.',
    delay: 400,
  },
  {
    icon: 'description',
    title: 'Document Scanning',
    description: 'Detect manipulated KYC documents, passports, and IDs using advanced texture and font analysis.',
    delay: 500,
  },
];

const stats = [
  { value: '99.9%', label: 'Detection Accuracy' },
  { value: '50M+', label: 'Assets Scanned' },
  { value: '<1s', label: 'Average Latency' },
];

/* ─── Scroll reveal wrapper ─── */
function Reveal({ children, className = '', delay = 0 }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{
        duration: 0.8,
        delay: delay / 1000,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── Feature Card ─── */
function FeatureCard({ icon, title, description, delay }) {
  return (
    <Reveal delay={delay}>
      <div className="deepshield-feature-card group">
        <div className="deepshield-feature-icon">
          <span className="material-symbols-outlined text-cyan-400 text-3xl group-hover:text-cyan-300 drop-shadow-[0_0_8px_rgba(0,242,255,0.5)] transition-colors">
            {icon}
          </span>
        </div>
        <h3 className="font-display text-xl font-semibold mb-3 text-white group-hover:text-cyan-100 transition-colors">
          {title}
        </h3>
        <p className="text-sm leading-relaxed text-slate-400 group-hover:text-slate-300 transition-colors">
          {description}
        </p>
      </div>
    </Reveal>
  );
}

/* ─── Floating Status Badge ─── */
function FloatingBadge({ icon, text, x, y, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 1.2 + delay, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="absolute hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full border border-cyan-500/20 bg-[#0a0f1a]/70 backdrop-blur-md text-[11px] text-cyan-300 font-medium z-20 whitespace-nowrap"
      style={{ left: x, top: y }}
    >
      <span className="material-symbols-outlined text-sm text-cyan-400">{icon}</span>
      {text}
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
    </motion.div>
  );
}

/* ─── Parallax Background ─── */
function ParallaxBackground() {
  const containerRef = useRef(null);

  useEffect(() => {
    const handleMove = (e) => {
      if (!containerRef.current) return;
      const x = e.clientX - window.innerWidth / 2;
      const y = e.clientY - window.innerHeight / 2;

      containerRef.current.querySelectorAll('.parallax-el').forEach((el) => {
        const speed = parseFloat(el.dataset.speed || 0);
        const xOff = x * speed;
        const yOff = y * speed;

        if (el.classList.contains('neural-grid-bg')) {
          el.style.transform = `perspective(500px) rotateX(60deg) translateY(${-100 + yOff}px) translateZ(-200px) translateX(${xOff}px)`;
        } else {
          el.style.transform = `translate(${xOff}px, ${yOff}px)`;
        }
      });
    };

    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  return (
    <div ref={containerRef} className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      <div className="neural-grid-bg parallax-el" data-speed="0.02" />
      <div className="orb w-[500px] h-[500px] bg-cyan-500/10 top-[-10%] left-[-10%] parallax-el" data-speed="-0.03" />
      <div className="orb w-[600px] h-[600px] bg-blue-600/10 top-[40%] right-[-10%] parallax-el" data-speed="-0.04" />
      <div className="orb w-[400px] h-[400px] bg-indigo-500/10 bottom-[-10%] left-[20%] parallax-el" data-speed="-0.02" />
    </div>
  );
}

/* ─── Main HomePage ─── */
export default function HomePage() {
  const navigate = useNavigate();

  return (
    <>
      <ParallaxBackground />

      <PageTransition className="!max-w-full !px-0 space-y-0 pb-0 pt-0">
        {/* ═══ Hero Section ═══ */}
        <section className="relative min-h-[95vh] flex items-center px-6 mesh-bg border-b border-white/5 overflow-hidden">
          <div className="max-w-[1440px] mx-auto w-full grid lg:grid-cols-2 gap-8 items-center relative z-10">
            {/* Left — Text content */}
            <div className="text-center lg:text-left">
              <Reveal>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/5 text-[11px] text-cyan-400 font-semibold uppercase tracking-[0.15em] mb-8">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  Global Threat Detection Active
                </div>
              </Reveal>

              <Reveal delay={100}>
                <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold mb-6 text-white leading-[1.1] tracking-tight deepshield-glow-text">
                  Detect Deepfakes Instantly.
                  <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                    Protect Reality.
                  </span>
                </h1>
              </Reveal>

              <Reveal delay={200}>
                <p className="text-lg text-slate-300 mb-10 max-w-xl leading-relaxed">
                  Advanced neural network analysis for real-time detection of synthetic media. Safeguard your digital
                  infrastructure across video, image, audio, and live streams with military-grade precision.
                </p>
              </Reveal>

              <Reveal delay={350}>
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center">
                  <button
                    id="hero-start-detection"
                    className="deepshield-btn-primary interactive"
                    onClick={() => navigate('/detect')}
                  >
                    Start Detection
                  </button>
                  <button
                    id="hero-live-detection"
                    className="deepshield-btn-secondary interactive"
                    onClick={() => navigate('/live')}
                  >
                    Try Live Detection
                  </button>
                </div>
              </Reveal>

              {/* Micro trust indicators */}
              <Reveal delay={500}>
                <div className="mt-10 flex flex-wrap gap-6 justify-center lg:justify-start text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm text-cyan-400/50">verified_user</span>
                    SOC 2 Certified
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm text-cyan-400/50">speed</span>
                    &lt;1s Latency
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm text-cyan-400/50">shield</span>
                    E2E Encrypted
                  </span>
                </div>
              </Reveal>
            </div>

            {/* Right — 3D Globe */}
            <div className="relative hidden lg:block">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1.2, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="relative w-full aspect-square max-w-[560px] mx-auto"
              >
                {/* Glow behind globe */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-500/10 via-blue-600/5 to-transparent blur-3xl scale-110" />

                <CyberGlobe className="relative z-10" />

                {/* Floating badges around the globe */}
                <FloatingBadge icon="radar" text="12 Nodes Online" x="0%" y="20%" delay={0} />
                <FloatingBadge icon="security" text="99.9% Accuracy" x="75%" y="10%" delay={0.2} />
                <FloatingBadge icon="trending_up" text="2.4M Scans Today" x="80%" y="75%" delay={0.4} />
                <FloatingBadge icon="bolt" text="AI Processing" x="-5%" y="70%" delay={0.6} />
              </motion.div>
            </div>
          </div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-20"
          >
            <span className="text-[10px] uppercase tracking-[0.2em] text-slate-600">Scroll to explore</span>
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="w-5 h-8 rounded-full border border-white/10 flex justify-center pt-1"
            >
              <div className="w-1 h-2 rounded-full bg-cyan-400/60" />
            </motion.div>
          </motion.div>
        </section>

        {/* ═══ Features Grid ═══ */}
        <section className="py-32 px-6 max-w-[1440px] mx-auto relative z-10">
          <Reveal>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-center mb-20 text-white deepshield-glow-text">
              Multimodal Detection Vectors
            </h2>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <FeatureCard key={feature.title} {...feature} />
            ))}
          </div>
        </section>

        {/* ═══ Trust Section ═══ */}
        <section className="py-24 border-y border-white/5 bg-[#080b12]/30 relative z-10 backdrop-blur-sm">
          <div className="max-w-[1440px] mx-auto px-6 text-center">
            <Reveal>
              <div className="flex flex-wrap justify-center gap-16 md:gap-32 items-center">
                {stats.map((stat, idx) => (
                  <motion.div
                    key={stat.label}
                    whileHover={{ scale: 1.1 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                    style={{ transitionDelay: `${idx * 100}ms` }}
                  >
                    <div className="font-display text-5xl md:text-6xl lg:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-cyan-400 to-blue-600 drop-shadow-[0_0_15px_rgba(0,242,255,0.4)] mb-3">
                      {stat.value}
                    </div>
                    <div className="text-[12px] font-semibold uppercase tracking-[0.1em] text-cyan-100/60">
                      {stat.label}
                    </div>
                  </motion.div>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        {/* ═══ CTA Section ═══ */}
        <section className="py-32 px-6 text-center mesh-bg relative z-10">
          <Reveal>
            <h2 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 deepshield-glow-text leading-[1.1]">
              Ready to secure your reality?
            </h2>
          </Reveal>

          <Reveal delay={150}>
            <p className="text-lg text-slate-300 mb-12 max-w-2xl mx-auto leading-relaxed">
              Deploy DeepShield AI into your infrastructure today and protect against next-generation synthetic media
              threats.
            </p>
          </Reveal>

          <Reveal delay={300}>
            <button
              id="cta-deploy"
              className="deepshield-btn-primary text-sm px-12 py-5 interactive"
              onClick={() => navigate('/detect')}
            >
              Initialize Deployment
            </button>
          </Reveal>
        </section>
      </PageTransition>
    </>
  );
}
