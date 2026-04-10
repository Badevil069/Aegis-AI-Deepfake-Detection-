import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  AudioLines,
  Film,
  FileImage,
  UploadCloud,
  CheckCircle2,
  Sparkles,
  X,
} from 'lucide-react';

const modeOptions = [
  { id: 'video', label: 'Video Detection', icon: Film, accept: '.mp4,.mov,.webm', desc: 'MP4, MOV, WebM' },
  { id: 'image', label: 'Image Detection', icon: FileImage, accept: '.jpg,.jpeg,.png', desc: 'JPG, PNG' },
  { id: 'voice', label: 'Voice Detection', icon: AudioLines, accept: '.wav,.mp3,.ogg', desc: 'WAV, MP3, OGG' },
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

  const clearFile = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl('');
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragActive(false);
    const dropped = event.dataTransfer.files?.[0];
    if (dropped) setSelectedFile(dropped);
  };

  const mediaKind = detectMediaKind(file);

  return (
    <div className="glass-card-elevated mx-auto w-full max-w-3xl p-8 md:p-10">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-cyan/20 to-brand-indigo/10">
          <UploadCloud className="h-7 w-7 text-brand-cyan" />
        </div>
        <h2 className="font-display text-2xl font-bold text-white">Upload Detection</h2>
        <p className="mt-2 text-sm text-slate-500">
          Drag a file or choose manually. We'll run a multimodal deepfake scan.
        </p>
      </div>

      {/* Mode selector */}
      <div className="grid gap-3 md:grid-cols-3 mb-6">
        {modeOptions.map((option) => {
          const Icon = option.icon;
          const active = option.id === mode;
          return (
            <button
              key={option.id}
              id={`mode-${option.id}`}
              className={[
                'relative rounded-xl border px-4 py-4 text-left transition-all duration-300 overflow-hidden',
                active
                  ? 'border-brand-cyan/50 bg-gradient-to-br from-brand-indigo/20 to-brand-cyan/5 text-white shadow-neon-cyan'
                  : 'border-white/10 bg-white/[0.02] text-slate-400 hover:border-white/20 hover:bg-white/[0.04]',
              ].join(' ')}
              onClick={() => setMode(option.id)}
            >
              {active && (
                <motion.div
                  layoutId="mode-bg"
                  className="absolute inset-0 rounded-xl bg-gradient-to-br from-brand-cyan/10 to-brand-indigo/5"
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                />
              )}
              <div className="relative">
                <div className="inline-flex items-center gap-2 text-sm font-semibold">
                  <Icon className="h-4 w-4" />
                  {option.label}
                </div>
                <p className="mt-1 text-[11px] text-slate-500">{option.desc}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Drop zone */}
      <motion.div
        onDragOver={(event) => {
          event.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        animate={dragActive ? { scale: 1.01 } : { scale: 1 }}
        className={[
          'relative rounded-2xl border-2 border-dashed px-6 py-14 text-center transition-all duration-300',
          dragActive
            ? 'border-brand-cyan bg-brand-cyan/[0.06] shadow-neon-cyan'
            : 'border-white/15 bg-black/15 hover:border-white/25 hover:bg-black/20',
        ].join(' ')}
      >
        {/* Background grid effect */}
        <div className="grid-bg pointer-events-none absolute inset-0 rounded-2xl opacity-50" />

        <div className="relative z-10">
          <motion.div
            animate={dragActive ? { scale: 1.1, y: -5 } : { scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <UploadCloud className="mx-auto h-14 w-14 text-brand-cyan/60" strokeWidth={1.2} />
          </motion.div>
          <p className="mt-4 text-sm text-slate-300">
            {dragActive ? 'Release to upload' : 'Drag & drop your media file here'}
          </p>
          <p className="mt-1 text-xs text-slate-600">or</p>
          <button
            id="browse-files-btn"
            className="ghost-button mt-3 px-5 py-2.5 text-sm"
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
          <p className="mt-4 text-[11px] text-slate-600">
            Supported: {selectedMode.desc} • Max 500MB
          </p>
        </div>
      </motion.div>

      {/* File preview */}
      <AnimatePresence>
        {file && (
          <motion.div
            initial={{ opacity: 0, y: 10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            className="mt-6 overflow-hidden rounded-xl border border-white/10 bg-black/25"
          >
            <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
              <p className="text-sm font-medium text-white">File Preview</p>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-cyan/30 bg-brand-cyan/8 px-3 py-1 text-xs text-brand-cyan">
                  <CheckCircle2 className="h-3 w-3" />
                  {file.name}
                </span>
                <button
                  onClick={clearFile}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-slate-400 transition hover:bg-white/10 hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="p-4">
              {mediaKind === 'image' && (
                <img src={previewUrl} alt="Preview" className="max-h-72 w-full rounded-xl object-cover" />
              )}
              {mediaKind === 'video' && (
                <video src={previewUrl} controls className="max-h-72 w-full rounded-xl bg-black" />
              )}
              {mediaKind === 'audio' && (
                <div className="rounded-xl bg-black/20 p-6">
                  <audio src={previewUrl} controls className="w-full" />
                </div>
              )}
              {mediaKind === 'unknown' && (
                <p className="inline-flex items-center gap-2 text-sm text-amber-300">
                  <AlertTriangle className="h-4 w-4" />
                  This file type may not preview correctly.
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Analyze button */}
      <button
        id="analyze-now-btn"
        className="cyber-button mt-8 inline-flex w-full items-center justify-center gap-2.5 py-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40"
        disabled={!file}
        onClick={() => onAnalyze?.({ mode, file, previewUrl, mediaKind })}
      >
        <Sparkles className="h-4 w-4" />
        <span>Analyze Now</span>
      </button>
    </div>
  );
}
