import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, CameraOff, Mic, MicOff, Play, Square, Video } from 'lucide-react';
import AudioWaveform from './AudioWaveform';

/**
 * WebcamMode — real webcam detection using getUserMedia.
 * Captures frames every 500ms and sends them for analysis via Socket.IO.
 */
export default function WebcamMode({ sendFrame, addLog }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);

  const [isRunning, setIsRunning] = useState(false);
  const [hasCamera, setHasCamera] = useState(false);
  const [camOn, setCamOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [frameCount, setFrameCount] = useState(0);

  // ── Start camera ──
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setHasCamera(true);
      addLog?.('info', 'Camera access granted. Ready to start detection.');
      return stream;
    } catch (err) {
      addLog?.('error', `Camera access denied: ${err.message}`);
      setHasCamera(false);
      return null;
    }
  }, [addLog]);

  // ── Stop camera ──
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setHasCamera(false);
  }, []);

  // ── Capture frame as base64 ──
  const captureFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) return null;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.7);
  }, []);

  // ── Start detection loop ──
  const startDetection = useCallback(async () => {
    if (!streamRef.current) {
      const stream = await startCamera();
      if (!stream) return;
    }

    setIsRunning(true);
    setFrameCount(0);
    addLog?.('info', 'Detection started. Capturing frames at 2 FPS...');

    intervalRef.current = setInterval(() => {
      const frame = captureFrame();
      if (frame) {
        sendFrame(frame);
        setFrameCount((c) => c + 1);
      }
    }, 500);
  }, [startCamera, captureFrame, sendFrame, addLog]);

  // ── Stop detection ──
  const stopDetection = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
    addLog?.('info', 'Detection stopped.');
  }, [addLog]);

  // ── Toggle cam/mic ──
  const toggleCam = useCallback(() => {
    const tracks = streamRef.current?.getVideoTracks();
    if (tracks?.length) {
      tracks.forEach((t) => { t.enabled = !t.enabled; });
      setCamOn((v) => !v);
    }
  }, []);

  const toggleMic = useCallback(() => {
    const tracks = streamRef.current?.getAudioTracks();
    if (tracks?.length) {
      tracks.forEach((t) => { t.enabled = !t.enabled; });
      setMicOn((v) => !v);
    }
  }, []);

  // ── Auto-start camera on mount ──
  useEffect(() => {
    startCamera();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      stopCamera();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-3">
      {/* Video feed */}
      <div className="glass-card relative overflow-hidden p-3">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="cyber-badge cyber-badge-glow text-[10px]">
              <Video className="h-3 w-3" />
              Webcam Feed
            </div>
            {isRunning && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 text-[10px] font-medium text-rose-300">
                <div className="h-1.5 w-1.5 rounded-full bg-rose-400 animate-pulse" />
                LIVE
              </span>
            )}
          </div>
          <span className="text-[10px] text-slate-600 font-mono">
            {frameCount} frames captured
          </span>
        </div>

        <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-white/8 bg-black">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full object-cover"
          />
          <canvas ref={canvasRef} className="hidden" />

          {/* Scan line during detection */}
          {isRunning && (
            <motion.div
              animate={{ top: ['0%', '100%', '0%'] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              className="pointer-events-none absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-cyan/60 to-transparent"
              style={{ boxShadow: '0 0 20px rgba(56,189,248,0.3)' }}
            />
          )}

          {!hasCamera && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/70">
              <CameraOff className="h-10 w-10 text-slate-600" />
              <p className="text-sm text-slate-400">Camera not available</p>
              <button onClick={startCamera} className="ghost-button px-4 py-2 text-xs">
                Retry Camera Access
              </button>
            </div>
          )}

          {/* Grid overlay */}
          {isRunning && (
            <div
              className="pointer-events-none absolute inset-0 opacity-15"
              style={{
                backgroundImage:
                  'linear-gradient(rgba(56,189,248,0.15) 1px, transparent 1px), linear-gradient(to right, rgba(56,189,248,0.15) 1px, transparent 1px)',
                backgroundSize: '40px 40px',
              }}
            />
          )}
        </div>
      </div>

      {/* Audio waveform */}
      {streamRef.current && (
        <div className="glass-card p-3">
          <div className="flex items-center gap-2 mb-2">
            <Mic className="h-3 w-3 text-brand-cyan/60" />
            <span className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Audio Waveform</span>
          </div>
          <AudioWaveform stream={streamRef.current} barCount={40} height={48} />
        </div>
      )}

      {/* Controls */}
      <div className="glass-card flex items-center justify-center gap-3 px-4 py-3">
        <button
          onClick={isRunning ? stopDetection : startDetection}
          className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-all ${
            isRunning
              ? 'border border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20'
              : 'cyber-button'
          }`}
        >
          {isRunning ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {isRunning ? 'Stop Detection' : 'Start Detection'}
        </button>

        <button
          onClick={toggleCam}
          className={`inline-flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
            camOn ? 'bg-white/8 text-white hover:bg-white/12' : 'bg-rose-500/15 text-rose-300 border border-rose-500/20'
          }`}
        >
          {camOn ? <Camera className="h-4 w-4" /> : <CameraOff className="h-4 w-4" />}
        </button>

        <button
          onClick={toggleMic}
          className={`inline-flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
            micOn ? 'bg-white/8 text-white hover:bg-white/12' : 'bg-rose-500/15 text-rose-300 border border-rose-500/20'
          }`}
        >
          {micOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
