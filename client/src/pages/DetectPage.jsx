import { useNavigate } from 'react-router-dom';
import { Upload, ShieldCheck } from 'lucide-react';
import PageTransition from '../components/PageTransition';
import UploadCard from '../components/UploadCard';

export default function DetectPage() {
  const navigate = useNavigate();

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

  return (
    <PageTransition className="py-12">
      <section className="mb-10 text-center">
        <div className="mb-3 flex justify-center">
          <span className="cyber-badge cyber-badge-glow">
            <Upload className="h-3 w-3" />
            Upload Detection Mode
          </span>
        </div>
        <h1 className="font-display text-4xl font-bold text-white md:text-5xl">
          Analyze <span className="glow-text">Video, Image, or Voice</span> Files
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-slate-400">
          Drag and drop evidence, select the detection type, and run a multimodal deepfake scan with simulated forensic output.
        </p>

        {/* Trust indicators */}
        <div className="mt-5 flex items-center justify-center gap-4 text-xs text-slate-600">
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="h-3 w-3 text-brand-cyan/50" />
            End-to-end encrypted
          </span>
          <span className="h-3 w-px bg-slate-700" />
          <span>Files auto-deleted after analysis</span>
          <span className="h-3 w-px bg-slate-700" />
          <span>GDPR compliant</span>
        </div>
      </section>

      <UploadCard onAnalyze={handleAnalyze} />
    </PageTransition>
  );
}
