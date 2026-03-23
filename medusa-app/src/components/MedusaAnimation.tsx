'use client';

import { useEffect, useRef } from 'react';

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  life: number; maxLife: number;
  size: number; opacity: number;
}

interface FlowLine {
  points: { x: number; y: number }[];
  speed: number;
  width: number;
  opacity: number;
}

export default function MedusaAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const context = ctx;

    let w = canvas.offsetWidth;
    let h = canvas.offsetHeight;
    canvas.width  = w;
    canvas.height = h;

    const ro = new ResizeObserver(() => {
      w = canvas.offsetWidth;
      h = canvas.offsetHeight;
      canvas.width  = w;
      canvas.height = h;
    });
    ro.observe(canvas);

    const FLOW_SCALE = 0.0028;
    const NUM_LINES  = 60;
    const LINE_LEN   = 100;

    function noise(x: number, y: number, t: number): number {
      return (
        Math.sin(x * 1.2 + t * 0.35) * 0.3 +
        Math.cos(y * 1.6 + t * 0.28) * 0.25 +
        Math.sin((x + y) * 0.85 + t * 0.45) * 0.25 +
        Math.cos((x - y) * 0.55 + t * 0.18) * 0.2
      );
    }
    function flowAngle(x: number, y: number, t: number): number {
      return noise(x * FLOW_SCALE, y * FLOW_SCALE, t) * Math.PI * 3;
    }

    const lines: FlowLine[] = Array.from({ length: NUM_LINES }, (_, i) => ({
      points: [{ x: w * (i / NUM_LINES + Math.random() * 0.02), y: Math.random() * h }],
      speed:   1.0 + Math.random() * 1.6,
      width:   0.4 + Math.random() * 0.9,
      opacity: 0.06 + Math.random() * 0.18,
    }));

    const particles: Particle[] = [];
    function spawnParticle() {
      if (particles.length > 40) return;
      particles.push({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.3, vy: -0.15 - Math.random() * 0.4,
        life: 0, maxLife: 90 + Math.random() * 130,
        size: 0.5 + Math.random() * 1.2,
        opacity: 0.2 + Math.random() * 0.35,
      });
    }

    let t = 0;
    let lastSpawn = 0;

    function draw(ts: number) {
      t = ts * 0.00035;

      // Light trailing fade — cream with slight opacity so lines decay slowly
      context.fillStyle = 'rgba(250, 246, 241, 0.14)';
      context.fillRect(0, 0, w, h);

      for (const line of lines) {
        const last = line.points[line.points.length - 1];
        const angle = flowAngle(last.x, last.y, t);
        const nx = last.x + Math.cos(angle) * line.speed;
        const ny = last.y + Math.sin(angle) * line.speed;
        line.points.push({ x: nx, y: ny });
        if (line.points.length > LINE_LEN) line.points.shift();

        if (nx < -10 || nx > w + 10 || ny < -10 || ny > h + 10) {
          line.points = [{ x: Math.random() * w, y: Math.random() * h }];
          line.opacity = 0.06 + Math.random() * 0.18;
          continue;
        }
        if (line.points.length < 3) continue;

        const pulse = 0.7 + 0.3 * Math.sin(t * 1.8 + line.points[0].x * 0.008);
        const alpha = line.opacity * pulse;

        context.beginPath();
        context.moveTo(line.points[0].x, line.points[0].y);
        for (let i = 1; i < line.points.length; i++) {
          const p  = line.points[i];
          const pp = line.points[i - 1];
          context.quadraticCurveTo(pp.x, pp.y, (p.x + pp.x) / 2, (p.y + pp.y) / 2);
        }

        // Warm rose/terracotta gradient — very subtle on the cream bg
        const grad = context.createLinearGradient(
          line.points[0].x, line.points[0].y, last.x, last.y
        );
        grad.addColorStop(0,   `rgba(200, 150, 130, 0)`);
        grad.addColorStop(0.4, `rgba(181,  96,  74, ${alpha * 0.4})`);
        grad.addColorStop(0.8, `rgba(181,  96,  74, ${alpha})`);
        grad.addColorStop(1,   `rgba(200, 120, 100, ${alpha * 0.25})`);

        context.strokeStyle = grad;
        context.lineWidth   = line.width;
        context.lineCap     = 'round';
        context.lineJoin    = 'round';
        context.stroke();
      }

      // Particles — tiny warm dots
      if (ts - lastSpawn > 150) { spawnParticle(); lastSpawn = ts; }
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx; p.y += p.vy; p.life++;
        if (p.life >= p.maxLife) { particles.splice(i, 1); continue; }
        const a = p.opacity * Math.sin((p.life / p.maxLife) * Math.PI);
        context.beginPath();
        context.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        context.fillStyle = `rgba(181, 96, 74, ${a * 0.6})`;
        context.fill();
      }

      // Soft vignette edges — warm cream
      const vx = w / 2, vy = h / 2;
      const vr = context.createRadialGradient(vx, vy, 0, vx, vy, Math.max(w, h) * 0.72);
      vr.addColorStop(0,   'rgba(250,246,241, 0)');
      vr.addColorStop(0.6, 'rgba(250,246,241, 0)');
      vr.addColorStop(1,   'rgba(250,246,241, 0.55)');
      context.fillStyle = vr;
      context.fillRect(0, 0, w, h);

      frameRef.current = requestAnimationFrame(draw);
    }

    frameRef.current = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(frameRef.current); ro.disconnect(); };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ display: 'block' }}
    />
  );
}
