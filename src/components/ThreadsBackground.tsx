/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef } from 'react';

export default function ThreadsBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Dynamic resize
    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Threads curves state
    interface Curve {
      points: { x: number; y: number }[];
      phase: number;
      speed: number;
      amplitude: number;
      color: string;
      lineWidth: number;
    }

    const curves: Curve[] = [];
    const curveCount = 4;

    for (let i = 0; i < curveCount; i++) {
      curves.push({
        points: [],
        phase: Math.random() * Math.PI * 2,
        speed: 0.003 + Math.random() * 0.005,
        amplitude: 30 + Math.random() * 40,
        color: i === 0 ? 'rgba(255, 255, 255, 0.08)' : i === 1 ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.03)',
        lineWidth: 1 + Math.random() * 1.5,
      });
    }

    // Animation loop
    const render = () => {
      ctx.fillStyle = '#050505';
      ctx.fillRect(0, 0, width, height);

      // Draw elegant grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.015)';
      ctx.lineWidth = 1;
      const gridSize = 80;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw glowing fluid threads
      curves.forEach((curve) => {
        curve.phase += curve.speed;

        ctx.beginPath();
        ctx.strokeStyle = curve.color;
        ctx.lineWidth = curve.lineWidth;

        // Draw flowing horizontal / vertical threads resembling loops
        for (let x = 0; x <= width; x += 10) {
          // Combination of sine waves to create organic threads
          const wave1 = Math.sin(x * 0.002 + curve.phase) * curve.amplitude;
          const wave2 = Math.cos(x * 0.005 - curve.phase * 1.5) * (curve.amplitude * 0.4);
          const y = height / 2 + wave1 + wave2;

          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();

        // Also add a large, faint circular loop in the center (representing the Threads spiral)
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.01)';
        ctx.lineWidth = 1.5;
        const centerX = width * 0.7;
        const centerY = height * 0.5;
        const baseRadius = Math.min(width, height) * 0.35;
        const currentRadius = Math.max(1, baseRadius + Math.sin(curve.phase) * 15);
        
        ctx.arc(
          centerX,
          centerY,
          currentRadius,
          0,
          Math.PI * 2
        );
        ctx.stroke();
      });

      // Add a couple of flowing floating glowing points (filament ends)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      for (let i = 0; i < 2; i++) {
        const time = Date.now() * 0.0005 + i * 100;
        const x = width * (0.3 + 0.4 * Math.sin(time * 0.5));
        const y = height * (0.4 + 0.2 * Math.cos(time * 0.8));
        
        ctx.beginPath();
        ctx.arc(x, y, 1.5, 0, Math.PI * 2);
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#ffffff';
        ctx.fill();
        ctx.shadowBlur = 0; // reset
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      id="threads-background-canvas"
      ref={canvasRef}
      className="fixed inset-0 w-full h-full -z-10 pointer-events-none"
    />
  );
}
