import { useEffect, useRef } from 'react';

/**
 * AudioWaveform — real-time audio frequency visualizer.
 * Uses Web Audio API AnalyserNode on a MediaStream.
 */
export default function AudioWaveform({ stream, barCount = 32, height = 48 }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const analyserRef = useRef(null);
  const contextRef = useRef(null);

  useEffect(() => {
    if (!stream) return;

    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    contextRef.current = audioCtx;
    const source = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 128;
    analyser.smoothingTimeConstant = 0.7;
    source.connect(analyser);
    analyserRef.current = analyser;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const w = canvas.width;
      const h = canvas.height;

      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, w, h);

      const step = Math.floor(bufferLength / barCount);
      const barWidth = (w / barCount) - 1;

      for (let i = 0; i < barCount; i++) {
        const val = dataArray[i * step] || 0;
        const barH = (val / 255) * h;
        const x = i * (barWidth + 1);

        const gradient = ctx.createLinearGradient(x, h, x, h - barH);
        gradient.addColorStop(0, 'rgba(99, 102, 241, 0.8)');
        gradient.addColorStop(1, 'rgba(56, 189, 248, 0.6)');

        ctx.fillStyle = gradient;
        ctx.fillRect(x, h - barH, barWidth, barH);
      }

      animRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      audioCtx.close().catch(() => {});
    };
  }, [stream, barCount]);

  return (
    <canvas
      ref={canvasRef}
      width={barCount * 6}
      height={height}
      className="w-full rounded-lg"
      style={{ height }}
    />
  );
}
