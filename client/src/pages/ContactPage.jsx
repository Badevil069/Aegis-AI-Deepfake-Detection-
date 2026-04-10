import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Code2, ExternalLink, Mail, MessageCircle, Send, CheckCircle2, MapPin } from 'lucide-react';
import PageTransition from '../components/PageTransition';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    setSubmitted(true);
  };

  return (
    <PageTransition className="space-y-10 py-12">
      {/* Header */}
      <section className="text-center">
        <div className="mb-3 flex justify-center">
          <span className="cyber-badge cyber-badge-glow">Contact & About</span>
        </div>
        <h1 className="font-display text-4xl font-bold text-white md:text-5xl">
          Mission-Driven <span className="glow-text">Media Trust</span>
        </h1>
        <p className="mx-auto mt-4 max-w-3xl text-base text-slate-400">
          We are building resilient AI safeguards to counter synthetic manipulation and support trusted digital communication.
        </p>
      </section>

      {/* Main content grid */}
      <section className="grid gap-6 lg:grid-cols-12">
        {/* About panel */}
        <div className="glass-card p-7 lg:col-span-5">
          <h2 className="text-2xl font-bold text-white">About This Project</h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-400">
            Aegis Sentinel is a premium frontend simulation of an AI cybersecurity platform focused on deepfake detection across uploaded and live media.
          </p>

          <hr className="section-divider my-6" />

          <h3 className="text-lg font-semibold text-white">Mission Statement</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">
            Enable organizations and individuals to verify media authenticity at speed, reduce fraud exposure, and improve trust in high-risk communication channels.
          </p>

          <hr className="section-divider my-6" />

          {/* Contact info */}
          <div className="space-y-3">
            <a href="mailto:support@aegissentinel.ai" className="flex items-center gap-3 text-sm text-slate-400 transition hover:text-brand-cyan">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/8 bg-white/[0.03]">
                <Mail className="h-4 w-4 text-brand-cyan/60" />
              </div>
              support@aegissentinel.ai
            </a>
            <div className="flex items-center gap-3 text-sm text-slate-500">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/8 bg-white/[0.03]">
                <MapPin className="h-4 w-4 text-brand-cyan/60" />
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
                key={label}
                href="#"
                aria-label={label}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/8 bg-white/[0.03] text-slate-500 transition-all duration-300 hover:border-brand-cyan/30 hover:bg-brand-cyan/5 hover:text-brand-cyan"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        {/* Contact form */}
        <div className="glass-card-elevated p-7 lg:col-span-7">
          <h2 className="text-2xl font-bold text-white">Get in Touch</h2>
          <p className="mt-2 text-sm text-slate-500">Tell us your use case, integration goals, or enterprise requirements.</p>

          <form onSubmit={handleSubmit} className="mt-7 grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-slate-500 mb-2">Name</label>
                <input
                  className="cyber-input"
                  placeholder="Your full name"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-slate-500 mb-2">Email</label>
                <input
                  type="email"
                  className="cyber-input"
                  placeholder="work@company.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-slate-500 mb-2">Organization</label>
              <input
                className="cyber-input"
                placeholder="Company name (optional)"
              />
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-slate-500 mb-2">Message</label>
              <textarea
                rows={5}
                className="cyber-input resize-none"
                placeholder="How can we help you?"
                required
              />
            </div>

            <button
              id="contact-submit-btn"
              className="cyber-button inline-flex items-center justify-center gap-2 py-3.5 text-sm"
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
