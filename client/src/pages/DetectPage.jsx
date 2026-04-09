import { useNavigate } from 'react-router-dom';
import { Upload } from 'lucide-react';
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
    <PageTransition className="py-10">
      <section className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.2em] text-brand-cyan">
          <Upload className="h-3.5 w-3.5" />
          Upload Detection Mode
        </div>
        <h1 className="mt-4 font-display text-4xl font-semibold text-white">Analyze Video, Image, or Voice Files</h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-300 md:text-base">
          Drag and drop evidence, select the detection type, and run a multimodal deepfake scan with simulated forensic output.
        </p>
      </section>

      <UploadCard onAnalyze={handleAnalyze} />
    </PageTransition>
  );
}
