import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, ShieldCheck, Mail } from 'lucide-react';
import PageTransition from '../components/PageTransition';
import UploadCard from '../components/UploadCard';
import { documentModeOptions } from '../data/uploadModes';
import EmailPasteCard from '../components/EmailPasteCard';

export default function DetectPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('media');

  const handleAnalyze = ({ mode, file, previewUrl, mediaKind }) => {
    navigate('/processing', {
      state: {
        source: 'upload',
        mode,
        file,
        filename: file?.name || 'uploaded-media',
        previewUrl,
        mediaKind,
      },
    });
  };

  const handleEmailAnalyze = (emailContent) => {
    navigate('/processing', {
      state: {
        source: 'email',
        mode: 'text-analysis',
        content: emailContent,
        filename: 'email-source.txt',
        mediaKind: 'email',
      },
    });
  };

  return (
    <PageTransition className="py-12">
      {/* Mesh background glow */}
      <div className="pointer-events-none fixed inset-0 z-0 mesh-bg opacity-50" />

      <section className="relative z-10 mb-10 text-center">
        <div className="mb-3 flex justify-center">
          <span className="cyber-badge cyber-badge-glow">
            {activeTab === 'media' ? <Upload className="h-3 w-3" /> : <Mail className="h-3 w-3" />}
            {activeTab === 'media' ? 'Media Detection Mode' : 'Email Analysis Mode'}
          </span>
        </div>
        
        <h1 className="font-display text-4xl font-bold text-white md:text-5xl deepshield-glow-text">
          Analyze <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Video, Image, or Email</span>
        </h1>
        
        {/* TAB SWITCHER */}
        <div className="mt-8 flex justify-center gap-2">
          <button 
            onClick={() => setActiveTab('media')}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all interactive ${
              activeTab === 'media' 
              ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.5)] font-bold' 
              : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
            }`}
          >
            Media Upload
          </button>
          <button 
            onClick={() => setActiveTab('email')}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all interactive ${
              activeTab === 'email' 
              ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.5)] font-bold' 
              : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
            }`}
          >
            Email Source
          </button>
        </div>

        <p className="mx-auto mt-6 max-w-2xl text-base text-slate-400">
          {activeTab === 'media' 
            ? 'Drag and drop evidence, select the detection type, and run a multimodal deepfake scan.'
            : 'Paste the raw email header and body to detect phishing, spoofing, and malicious intent.'}
        </p>

        {/* Trust indicators */}
        <div className="mt-5 flex items-center justify-center gap-4 text-xs text-slate-600">
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="h-3 w-3 text-cyan-400/50" />
            Forensic grade analysis
          </span>
          <span className="h-3 w-px bg-slate-700" />
          <span>Real-time AI verification</span>
        </div>
      </section>

      {activeTab === 'media' ? (
        <section className="relative z-10 grid gap-6 lg:grid-cols-2 lg:items-start">
          <UploadCard
            onAnalyze={handleAnalyze}
            title="Media Deepfake Detection"
            subtitle="Upload video, image, or audio and run multimodal deepfake analysis."
            analyzeLabel="Analyze Media"
          />

          <UploadCard
            onAnalyze={handleAnalyze}
            modeOptions={documentModeOptions}
            defaultMode="document"
            title="Fake Document Verification"
            subtitle="Upload PDFs and office documents to detect metadata tampering and fraud risks."
            analyzeLabel="Verify Document"
          />
        </section>
      ) : (
        <div className="relative z-10">
          <EmailPasteCard onAnalyze={handleEmailAnalyze} />
        </div>
      )}
    </PageTransition>
  );
}