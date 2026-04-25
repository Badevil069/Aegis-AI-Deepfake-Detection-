import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Code2, ExternalLink, Mail, MessageCircle, Send, CheckCircle2, MapPin } from 'lucide-react';
import PageTransition from '../components/PageTransition';
import FantasyBackground from '../components/FantasyBackground';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    setSubmitted(true);
  };

  return (
    <PageTransition className="space-y-10 pt-28 pb-12">
      <div className="pointer-events-none fixed inset-0 z-0 mesh-bg opacity-40" />
      <FantasyBackground />

      {/* Header */}
      <section className="relative z-10 text-center">
        <div className="mb-3 flex justify-center">
          <span className="cyber-badge cyber-badge-glow">Contact & About</span>
        </div>
        <h1 className="font-display text-4xl font-bold text-white md:text-5xl deepshield-glow-text">
          Mission-Driven <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Media Trust</span>
        </h1>
        <p className="mx-auto mt-4 max-w-3xl text-base text-slate-400">
          We are building resilient AI safeguards to counter synthetic manipulation and support trusted digital communication.
        </p>
      </section>

      {/* Main content grid */}
      <section className="relative z-10 grid gap-6 lg:grid-cols-12">
        {/* About panel */}
        <div className="deepshield-feature-card lg:col-span-5">
          <h2 className="text-2xl font-bold text-white deepshield-glow-text">About This Project</h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-400">
            Aegis Sentinel is a premium frontend simulation of an AI cybersecurity platform focused on deepfake detection across uploaded and live media.
          </p>

          <hr className="my-6 border-cyan-500/10" />

          <h3 className="text-lg font-semibold text-white">Mission Statement</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">
            Enable organizations and individuals to verify media authenticity at speed, reduce fraud exposure, and improve trust in high-risk communication channels.
          </p>

          <hr className="my-6 border-cyan-500/10" />

          {/* Contact info */}
          <div className="space-y-3">
            <a href="mailto:support@aegissentinel.ai" className="flex items-center gap-3 text-sm text-slate-400 transition hover:text-cyan-400 interactive">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-cyan-500/15 bg-cyan-500/5">
                <Mail className="h-4 w-4 text-cyan-400/60" />
              </div>
              support@aegissentinel.ai
            </a>
            <div className="flex items-center gap-3 text-sm text-slate-500">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-cyan-500/15 bg-cyan-500/5">
                <MapPin className="h-4 w-4 text-cyan-400/60" />
              </div>
              Remote-first organization
            </div>
          </div>

          {/* Social links */}
          <div className="mt-6 flex gap-2">
            {[
              { icon: Code2, label: 'GitHub' },
              { icon: ExternalLink, label: 'LinkedIn' },
              { icon: Globe, label: 'Website' },
              { icon: MessageCircle, label: 'Discord' },
            ].map(({ icon: Icon, label }) => (
              <a
                key={label} href="#" aria-label={label}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-500/15 bg-cyan-500/5 text-slate-500 transition-all duration-300 hover:border-cyan-400/40 hover:bg-cyan-400/10 hover:text-cyan-400 interactive"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        {/* Contact form */}
        <div className="deepshield-feature-card lg:col-span-7" style={{ border: '1px solid rgba(6,182,212,0.15)' }}>
          <h2 className="text-2xl font-bold text-white deepshield-glow-text">Get in Touch</h2>
          <p className="mt-2 text-sm text-slate-500">Tell us your use case, integration goals, or enterprise requirements.</p>

          <form onSubmit={handleSubmit} className="mt-7 grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-cyan-400/60 mb-2">Name</label>
                <input className="cyber-input" placeholder="Your full name" required />
              </div>
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-cyan-400/60 mb-2">Email</label>
                <input type="email" className="cyber-input" placeholder="work@company.com" required />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-cyan-400/60 mb-2">Organization</label>
              <input className="cyber-input" placeholder="Company name (optional)" />
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-cyan-400/60 mb-2">Message</label>
              <textarea rows={5} className="cyber-input resize-none" placeholder="How can we help you?" required />
            </div>

            <button
              id="contact-submit-btn"
              className="deepshield-btn-primary inline-flex items-center justify-center gap-2 py-3.5 text-sm interactive"
              type="submit"
            >
              <Send className="h-4 w-4" />
              <span>Send Message</span>
            </button>
          </form>

          <AnimatePresence>
            {submitted && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mt-5 flex items-center gap-3 rounded-xl border border-emerald-400/20 bg-emerald-400/5 px-4 py-3 text-sm text-emerald-200"
              >
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                Thanks! Your message has been queued in this demo interface.
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
    </PageTransition>
  );
}
