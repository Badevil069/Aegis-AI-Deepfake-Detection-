import { useState } from 'react';
import { Globe, Mail, MessageCircle, Send } from 'lucide-react';
import PageTransition from '../components/PageTransition';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    setSubmitted(true);
  };

  return (
    <PageTransition className="space-y-8 py-10">
      <section className="text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-brand-cyan">Contact and About</p>
        <h1 className="mt-3 font-display text-4xl font-semibold text-white">Mission-Driven Media Trust</h1>
        <p className="mx-auto mt-3 max-w-3xl text-sm text-slate-300 md:text-base">
          We are building resilient AI safeguards to counter synthetic manipulation and support trusted digital communication.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-12">
        <div className="glass-card p-6 lg:col-span-5">
          <h2 className="text-2xl font-semibold text-white">About This Project</h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-300">
            Aegis Sentinel is a premium frontend simulation of an AI cybersecurity platform focused on deepfake detection across uploaded and live media.
          </p>

          <h3 className="mt-6 text-lg font-semibold text-white">Mission Statement</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">
            Enable organizations and individuals to verify media authenticity at speed, reduce fraud exposure, and improve trust in high-risk communication channels.
          </p>

          <div className="mt-6 space-y-2">
            <a href="#" className="inline-flex items-center gap-2 text-sm text-slate-300 transition hover:text-white">
              <Mail className="h-4 w-4 text-brand-cyan" />
              support@aegissentinel.ai
            </a>
            <a href="#" className="block text-sm text-slate-400 transition hover:text-slate-200">Status: Simulated frontend environment</a>
          </div>

          <div className="mt-6 flex gap-3">
            <a
              href="#"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-slate-300 transition hover:border-brand-cyan/70 hover:text-white"
            >
              <Globe className="h-4 w-4" />
            </a>
            <a
              href="#"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-slate-300 transition hover:border-brand-cyan/70 hover:text-white"
            >
              <MessageCircle className="h-4 w-4" />
            </a>
          </div>
        </div>

        <div className="glass-card p-6 lg:col-span-7">
          <h2 className="text-2xl font-semibold text-white">Contact Form</h2>
          <p className="mt-2 text-sm text-slate-400">Tell us your use case, integration goals, or enterprise requirements.</p>

          <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <input
                className="rounded-xl border border-white/15 bg-black/20 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-brand-cyan/70 focus:outline-none"
                placeholder="Your name"
                required
              />
              <input
                type="email"
                className="rounded-xl border border-white/15 bg-black/20 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-brand-cyan/70 focus:outline-none"
                placeholder="Work email"
                required
              />
            </div>
            <input
              className="rounded-xl border border-white/15 bg-black/20 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-brand-cyan/70 focus:outline-none"
              placeholder="Organization"
            />
            <textarea
              rows={5}
              className="rounded-xl border border-white/15 bg-black/20 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-brand-cyan/70 focus:outline-none"
              placeholder="How can we help?"
              required
            />
            <button className="cyber-button inline-flex items-center justify-center gap-2 py-3 text-sm" type="submit">
              <Send className="h-4 w-4" />
              Send Message
            </button>
          </form>

          {submitted && (
            <p className="mt-4 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
              Thanks. Your message has been queued in this demo interface.
            </p>
          )}
        </div>
      </section>
    </PageTransition>
  );
}
