import { useEffect, useRef } from "react";
import { VoiceStatus } from "@/hooks/useVoiceAssistant";

interface JarvisWaveformProps {
  status: VoiceStatus;
  audioLevel: number;
}

const STATUS_COLORS: Record<VoiceStatus, string[]> = {
  idle: ["#334155", "#475569"],
  "wake-listening": ["#06b6d4", "#0891b2"],
  listening: ["#00D4FF", "#00FF88"],
  processing: ["#a855f7", "#6366f1"],
  speaking: ["#f59e0b", "#ef4444"],
};

export function JarvisWaveform({ status, audioLevel }: JarvisWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);
  const phaseRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = 280;
    canvas.width = size * 2;
    canvas.height = size * 2;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(2, 2);

    const cx = size / 2;
    const cy = size / 2;
    const baseRadius = 80;

    const draw = () => {
      ctx.clearRect(0, 0, size, size);
      phaseRef.current += 0.02;
      const colors = STATUS_COLORS[status];
      const amplitude = status === "idle" ? 2 : Math.max(5, audioLevel * 40);
      const rings = status === "idle" ? 2 : 3;

      for (let ring = 0; ring < rings; ring++) {
        const ringOffset = ring * 15;
        const ringAlpha = 1 - ring * 0.25;

        ctx.beginPath();
        const gradient = ctx.createLinearGradient(0, 0, size, size);
        gradient.addColorStop(0, colors[0]);
        gradient.addColorStop(1, colors[1]);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2.5 - ring * 0.5;
        ctx.globalAlpha = ringAlpha;

        const points = 128;
        for (let i = 0; i <= points; i++) {
          const angle = (i / points) * Math.PI * 2;
          const waveCount = status === "processing" ? 8 : 6;
          const wave = Math.sin(angle * waveCount + phaseRef.current * (2 + ring)) * amplitude;
          const wave2 = Math.cos(angle * 3 - phaseRef.current * 1.5) * (amplitude * 0.5);
          const r = baseRadius + ringOffset + wave + wave2;
          const x = cx + Math.cos(angle) * r;
          const y = cy + Math.sin(angle) * r;
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
      }

      // Inner glow
      ctx.globalAlpha = 0.08 + audioLevel * 0.12;
      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, baseRadius);
      glow.addColorStop(0, colors[0]);
      glow.addColorStop(1, "transparent");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, baseRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = 1;
      frameRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(frameRef.current);
  }, [status, audioLevel]);

  return (
    <canvas
      ref={canvasRef}
      className="mx-auto"
      style={{ filter: status !== "idle" ? `drop-shadow(0 0 30px ${STATUS_COLORS[status][0]}40)` : "none" }}
    />
  );
}
