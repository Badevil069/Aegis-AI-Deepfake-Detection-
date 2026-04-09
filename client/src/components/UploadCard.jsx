import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  AudioLines,
  Film,
  FileImage,
  UploadCloud,
  CheckCircle2,
} from 'lucide-react';

const modeOptions = [
  { id: 'video', label: 'Video Detection', icon: Film, accept: '.mp4,.mov,.webm' },
  { id: 'image', label: 'Image Detection', icon: FileImage, accept: '.jpg,.jpeg,.png' },
  { id: 'voice', label: 'Voice Detection', icon: AudioLines, accept: '.wav,.mp3,.ogg' },
];

function detectMediaKind(file) {
  if (!file?.type) return 'unknown';
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('video/')) return 'video';
  if (file.type.startsWith('audio/')) return 'audio';
  return 'unknown';
}

export default function UploadCard({ onAnalyze }) {
  const [mode, setMode] = useState('video');
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const inputRef = useRef(null);

  const selectedMode = useMemo(
    () => modeOptions.find((option) => option.id === mode) || modeOptions[0],
    [mode],
  );

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const setSelectedFile = (pickedFile) => {
    if (!pickedFile) return;
    if (previewUrl) URL.revokeObjectURL(previewUrl);

    setFile(pickedFile);
    const objectUrl = URL.createObjectURL(pickedFile);
    setPreviewUrl(objectUrl);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragActive(false);
    const dropped = event.dataTransfer.files?.[0];
    if (dropped) setSelectedFile(dropped);
  };

  const mediaKind = detectMediaKind(file);

  return (
    <div className="glass-card mx-auto w-full max-w-3xl p-6 md:p-8">
      <h2 className="text-center font-display text-2xl font-semibold text-white">Upload Detection</h2>
      <p className="mt-2 text-center text-sm text-slate-400">
        Drag a file or choose one manually. Supported formats: mp4, jpg, wav.
      </p>

      <div className="mt-6 grid gap-3 md:grid-cols-3">
        {modeOptions.map((option) => {
          const Icon = option.icon;
          const active = option.id === mode;
          return (
            <button
              key={option.id}
              className={[
                'rounded-xl border px-4 py-3 text-left transition-all',
                active
                  ? 'border-brand-cyan/80 bg-brand-indigo/30 text-white shadow-soft-glow'
                  : 'border-white/15 bg-white/5 text-slate-300 hover:border-white/30',
              ].join(' ')}
              onClick={() => setMode(option.id)}
            >
              <div className="inline-flex items-center gap-2 text-sm font-medium">
                <Icon className="h-4 w-4" />
                {option.label}
              </div>
            </button>
          );
        })}
      </div>

      <motion.div
        onDragOver={(event) => {
          event.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        className={[
          'mt-6 rounded-2xl border-2 border-dashed px-4 py-10 text-center transition',
          dragActive
            ? 'border-brand-cyan bg-brand-cyan/10 shadow-soft-glow'
            : 'border-white/20 bg-black/20',
        ].join(' ')}
      >
        <UploadCloud className="mx-auto h-12 w-12 text-brand-cyan" />
        <p className="mt-4 text-sm text-slate-300">Drop your media file here or</p>
        <button
          className="mt-3 rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm text-white transition hover:border-brand-cyan/70 hover:bg-brand-cyan/10"
          onClick={() => inputRef.current?.click()}
        >
          Browse Files
        </button>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={selectedMode.accept}
          onChange={(event) => setSelectedFile(event.target.files?.[0])}
        />
        <p className="mt-3 text-xs text-slate-500">Current mode accepts: {selectedMode.accept}</p>
      </motion.div>

      {file && (
        <div className="mt-6 rounded-xl border border-white/15 bg-black/30 p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-medium text-white">File Preview</p>
            <span className="inline-flex items-center gap-1 rounded-full border border-brand-cyan/40 bg-brand-cyan/10 px-3 py-1 text-xs text-brand-cyan">
              <CheckCircle2 className="h-3 w-3" />
              {file.name}
            </span>
          </div>

          {mediaKind === 'image' && (
            <img src={previewUrl} alt="Preview" className="max-h-72 w-full rounded-xl object-cover" />
          )}

          {mediaKind === 'video' && (
            <video src={previewUrl} controls className="max-h-72 w-full rounded-xl bg-black" />
          )}

          {mediaKind === 'audio' && (
            <audio src={previewUrl} controls className="w-full" />
          )}

          {mediaKind === 'unknown' && (
            <p className="inline-flex items-center gap-2 text-sm text-amber-300">
              <AlertTriangle className="h-4 w-4" />
              This file type may not preview correctly.
            </p>
          )}
        </div>
      )}

      <button
        className="cyber-button mt-6 w-full py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
        disabled={!file}
        onClick={() => onAnalyze?.({ mode, file, previewUrl, mediaKind })}
      >
        Analyze Now
      </button>
    </div>
  );
}
