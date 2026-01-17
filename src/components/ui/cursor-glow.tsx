'use client';

import { useEffect, useRef, useState } from 'react';

export function CursorGlow() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const animationRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resize();
    window.addEventListener('resize', resize);

    // Particle system
    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      maxLife: number;
      size: number;
    }> = [];

    let targetX = mousePos.x;
    let targetY = mousePos.y;
    let currentX = mousePos.x;
    let currentY = mousePos.y;

    const draw = () => {
      // Smooth follow cursor
      targetX = mousePos.x;
      targetY = mousePos.y;
      currentX += (targetX - currentX) * 0.1;
      currentY += (targetY - currentY) * 0.1;

      // Clear with fade effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Add new particles at cursor position
      if (Math.random() > 0.7) {
        particles.push({
          x: currentX + (Math.random() - 0.5) * 50,
          y: currentY + (Math.random() - 0.5) * 50,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2,
          life: 0,
          maxLife: 40 + Math.random() * 40,
          size: 2 + Math.random() * 3,
        });
      }

      // Draw main cursor glow
      const gradient = ctx.createRadialGradient(
        currentX, currentY, 0,
        currentX, currentY, 200
      );
      gradient.addColorStop(0, 'rgba(80, 227, 194, 0.15)');
      gradient.addColorStop(0.5, 'rgba(80, 227, 194, 0.05)');
      gradient.addColorStop(1, 'rgba(80, 227, 194, 0)');

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw and update particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life++;

        const alpha = 1 - p.life / p.maxLife;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(80, 227, 194, ${alpha * 0.5})`;
        ctx.fill();

        if (p.life >= p.maxLife) {
          particles.splice(i, 1);
        }
      }

      // Draw grid lines near cursor
      ctx.strokeStyle = 'rgba(80, 227, 194, 0.03)';
      ctx.lineWidth = 1;

      const gridSize = 50;
      const gridRange = 300;

      for (let x = currentX - gridRange; x < currentX + gridRange; x += gridSize) {
        const dist = Math.abs(x - currentX) / gridRange;
        ctx.globalAlpha = (1 - dist) * 0.3;
        ctx.beginPath();
        ctx.moveTo(x, currentY - gridRange);
        ctx.lineTo(x, currentY + gridRange);
        ctx.stroke();
      }

      for (let y = currentY - gridRange; y < currentY + gridRange; y += gridSize) {
        const dist = Math.abs(y - currentY) / gridRange;
        ctx.globalAlpha = (1 - dist) * 0.3;
        ctx.beginPath();
        ctx.moveTo(currentX - gridRange, y);
        ctx.lineTo(currentX + gridRange, y);
        ctx.stroke();
      }

      ctx.globalAlpha = 1;

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [mousePos]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.8 }}
    />
  );
}
