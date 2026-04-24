import { useEffect, useRef } from 'react';

/**
 * RadarScan — Canvas-based animated radar sweep with detection pings.
 * A rotating scan line sweeps the radar field, occasionally triggering
 * "threat detected" blips that pulse and fade out.
 */
export default function RadarScan({ className = '' }) {
  const canvasRef = useRef(null);
  const frameRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio, 2);

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener('resize', resize);

    // Blip data — random threat pings
    const blips = [];
    const addBlip = () => {
      const angle = Math.random() * Math.PI * 2;
      const dist = 0.2 + Math.random() * 0.7;
      blips.push({ angle, dist, life: 1, maxLife: 2 + Math.random() * 2 });
      if (blips.length > 12) blips.shift();
    };

    // Pre-seed some blips
    for (let i = 0; i < 5; i++) addBlip();

    let lastBlipTime = 0;

    const draw = (time) => {
      frameRef.current = requestAnimationFrame(draw);
      const t = time / 1000;
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      const cx = w / 2;
      const cy = h / 2;
      const radius = Math.min(cx, cy) * 0.88;

      ctx.clearRect(0, 0, w, h);

      // ─── Concentric rings ───
      for (let i = 1; i <= 4; i++) {
        const r = (radius / 4) * i;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0, 242, 255, ${i === 4 ? 0.15 : 0.06})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // ─── Cross hairs ───
      ctx.strokeStyle = 'rgba(0, 242, 255, 0.06)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx - radius, cy);
      ctx.lineTo(cx + radius, cy);
      ctx.moveTo(cx, cy - radius);
      ctx.lineTo(cx, cy + radius);
      ctx.stroke();

      // ─── Diagonal lines ───
      for (let a = 0; a < 4; a++) {
        const angle = (a * Math.PI) / 4 + Math.PI / 8;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(angle) * radius * 0.15, cy + Math.sin(angle) * radius * 0.15);
        ctx.lineTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
        ctx.strokeStyle = 'rgba(0, 242, 255, 0.03)';
        ctx.stroke();
      }

      // ─── Rotating sweep ───
      const sweepAngle = t * 1.2;
      const sweepLen = 0.6; // radians of trail

      for (let s = 0; s < 40; s++) {
        const frac = s / 40;
        const a = sweepAngle - frac * sweepLen;
        const alpha = (1 - frac) * 0.18;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(a) * radius, cy + Math.sin(a) * radius);
        ctx.strokeStyle = `rgba(0, 242, 255, ${alpha})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Main sweep line
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(sweepAngle) * radius, cy + Math.sin(sweepAngle) * radius);
      ctx.strokeStyle = 'rgba(0, 242, 255, 0.6)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // ─── Center dot ───
      ctx.beginPath();
      ctx.arc(cx, cy, 3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 242, 255, 0.8)';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx, cy, 8, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 242, 255, 0.1)';
      ctx.fill();

      // ─── Blips ───
      if (t - lastBlipTime > 1.5 + Math.random() * 2) {
        addBlip();
        lastBlipTime = t;
      }

      blips.forEach((blip, idx) => {
        blip.life -= 0.008;
        if (blip.life <= 0) {
          blips.splice(idx, 1);
          return;
        }

        const bx = cx + Math.cos(blip.angle) * radius * blip.dist;
        const by = cy + Math.sin(blip.angle) * radius * blip.dist;
        const alpha = Math.min(1, blip.life) * 0.9;
        const pulseR = 4 + Math.sin(t * 4) * 2;

        // Outer pulse
        ctx.beginPath();
        ctx.arc(bx, by, pulseR + 8, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 242, 255, ${alpha * 0.08})`;
        ctx.fill();

        // Inner dot
        ctx.beginPath();
        ctx.arc(bx, by, pulseR, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 242, 255, ${alpha * 0.7})`;
        ctx.fill();

        // Core
        ctx.beginPath();
        ctx.arc(bx, by, 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.fill();
      });

      // ─── Outer glow ring ───
      const grad = ctx.createRadialGradient(cx, cy, radius * 0.9, cx, cy, radius * 1.05);
      grad.addColorStop(0, 'rgba(0, 242, 255, 0)');
      grad.addColorStop(0.5, 'rgba(0, 242, 255, 0.03)');
      grad.addColorStop(1, 'rgba(0, 242, 255, 0)');
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 1.05, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
    };

    frameRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', resize);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-full ${className}`}
      style={{ minHeight: '300px' }}
    />
  );
}
