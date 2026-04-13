import React, { useState } from 'react'; // Added useState
import { useNavigate } from 'react-router-dom';
import { Upload, ShieldCheck, Mail } from 'lucide-react'; // Added Mail icon
import PageTransition from '../components/PageTransition';
import UploadCard from '../components/UploadCard';
import EmailPasteCard from '../components/EmailPasteCard'; // Import your new component

export default function DetectPage() {
  const navigate = useNavigate();
  // New state to toggle between 'media' and 'email'
  const [activeTab, setActiveTab] = useState('media');

  const handleAnalyze = ({ mode, file, previewUrl, mediaKind }) => {
    navigate('/processing', {
      state: {
        source: 'upload',
        mode,
        filename: file?.name || 'uploaded-media',
        previewUrl,
        mediaKind,
      },
    });
  };

  // Handler for Email Analysis
  const handleEmailAnalyze = (emailContent) => {
    navigate('/processing', {
      state: {
        source: 'email',
        mode: 'text-analysis',
        content: emailContent, // Pass the pasted text
        filename: 'email-source.txt',
        mediaKind: 'email',
      },
    });
  };

  return (
    <PageTransition className="py-12">
      <section className="mb-10 text-center">
        <div className="mb-3 flex justify-center">
          <span className="cyber-badge cyber-badge-glow">
            {activeTab === 'media' ? <Upload className="h-3 w-3" /> : <Mail className="h-3 w-3" />}
            {activeTab === 'media' ? 'Media Detection Mode' : 'Email Analysis Mode'}
          </span>
        </div>
        
        <h1 className="font-display text-4xl font-bold text-white md:text-5xl">
          Analyze <span className="glow-text">Video, Image, or Email</span>
        </h1>
        
        {/* TAB SWITCHER */}
        <div className="mt-8 flex justify-center gap-2">
          <button 
            onClick={() => setActiveTab('media')}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
              activeTab === 'media' 
              ? 'bg-brand-cyan text-black shadow-[0_0_15px_rgba(6,182,212,0.5)]' 
              : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            Media Upload
          </button>
          <button 
            onClick={() => setActiveTab('email')}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
              activeTab === 'email' 
              ? 'bg-brand-cyan text-black shadow-[0_0_15px_rgba(6,182,212,0.5)]' 
              : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
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
            <ShieldCheck className="h-3 w-3 text-brand-cyan/50" />
            Forensic grade analysis
          </span>
          <span className="h-3 w-px bg-slate-700" />
          <span>Real-time AI verification</span>
        </div>
      </section>

      {/* CONDITIONAL RENDERING */}
      {activeTab === 'media' ? (
        <UploadCard onAnalyze={handleAnalyze} />
      ) : (
        <EmailPasteCard onAnalyze={handleEmailAnalyze} />
      )}
    </PageTransition>
  );
}