import { useEffect, useRef, useState } from "react";
import { createLunarScene } from "@/components/lunarScene";
import { getMoonPhase, getPhaseGold, getPhaseRed, isEclipseNight } from "@/utils/moonphase";

// Hero moon: WebGL scene (lunarScene.js) lit to tonight's real phase.
// Falls back to the original 2D canvas moon when WebGL isn't available.
export const MoonCanvas = ({ className = "", scrollProgress, interactionRef }) => {
  const canvasRef = useRef(null);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    if (fallback || !canvasRef.current) return undefined;
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const scene = createLunarScene(canvasRef.current, {
      phase: getMoonPhase().phase,
      eclipse: isEclipseNight(),
      gold: getPhaseGold(),
      red: getPhaseRed(),
      reducedMotion,
      interactionTarget: interactionRef?.current,
    });
    if (!scene) {
      setFallback(true);
      return undefined;
    }
    scene.setScroll(scrollProgress?.get?.() ?? 0);
    const unsubscribe = scrollProgress?.on?.("change", (v) => scene.setScroll(v));
    return () => {
      unsubscribe?.();
      scene.destroy();
    };
  }, [fallback, scrollProgress, interactionRef]);

  if (fallback) return <MoonCanvas2D className={className} />;
  return (
    <canvas ref={canvasRef} aria-hidden="true" className={`block h-full w-full ${className}`} data-testid="hero-moon-canvas" />
  );
};

const MoonCanvas2D = ({ className = "" }) => {
  const canvasRef = useRef(null);
  const mouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let raf;
    let t = 0;

    const particles = Array.from({ length: 60 }, () => ({
      a: Math.random() * Math.PI * 2,
      r: 1.15 + Math.random() * 0.55,
      s: 0.0008 + Math.random() * 0.0022,
      size: 0.6 + Math.random() * 1.8,
      gold: Math.random() > 0.35,
    }));

    const resize = () => {
      const { clientWidth, clientHeight } = canvas.parentElement;
      canvas.width = clientWidth * devicePixelRatio;
      canvas.height = clientHeight * devicePixelRatio;
    };
    resize();
    window.addEventListener("resize", resize);

    const onMove = (e) => {
      mouse.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", onMove);

    const draw = () => {
      t += 1;
      const W = canvas.width;
      const H = canvas.height;
      const wide = W / devicePixelRatio >= 1024;
      const cx = W * (wide ? 0.72 : 0.8) + mouse.current.x * 18 * devicePixelRatio;
      const cy = H * (wide ? 0.4 : 0.18) + mouse.current.y * 18 * devicePixelRatio;
      const R = Math.min(W, H) * (wide ? 0.17 : 0.12);

      ctx.clearRect(0, 0, W, H);

      const glow = ctx.createRadialGradient(cx, cy, R * 0.4, cx, cy, R * 2.4);
      glow.addColorStop(0, "rgba(212,175,55,0.10)");
      glow.addColorStop(0.5, "rgba(200,50,43,0.05)");
      glow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, W, H);

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(-0.35 + Math.sin(t * 0.004) * 0.05 + mouse.current.x * 0.06);
      ctx.beginPath();
      ctx.ellipse(0, 0, R * 1.45, R * 0.42, 0, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(212,175,55,0.4)";
      ctx.lineWidth = 1.2 * devicePixelRatio;
      ctx.stroke();
      ctx.restore();

      const p = getMoonPhase().phase;
      const term = Math.cos(2 * Math.PI * p);
      const eclipse = isEclipseNight();

      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fillStyle = eclipse ? "#1f0f10" : "#16161d";
      ctx.fill();

      ctx.save();
      ctx.beginPath();
      if (p < 0.5) {
        ctx.arc(cx, cy, R, -Math.PI / 2, Math.PI / 2, false);
        ctx.ellipse(cx, cy, Math.max(R * Math.abs(term), 0.001), R, 0, Math.PI / 2, -Math.PI / 2, term < 0);
      } else {
        ctx.arc(cx, cy, R, Math.PI / 2, Math.PI * 1.5, false);
        ctx.ellipse(cx, cy, Math.max(R * Math.abs(term), 0.001), R, 0, -Math.PI / 2, Math.PI / 2, term > 0);
      }
      ctx.closePath();
      ctx.clip();

      const body = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.35, R * 0.1, cx, cy, R);
      body.addColorStop(0, "#f4f1ea");
      body.addColorStop(0.55, "#b9b4a8");
      body.addColorStop(0.9, "#6b675e");
      body.addColorStop(1, "#3a3833");
      ctx.fillStyle = body;
      ctx.fillRect(cx - R, cy - R, R * 2, R * 2);

      ctx.fillStyle = "rgba(0,0,0,0.14)";
      [[-0.3, -0.15, 0.14], [0.25, 0.3, 0.1], [0.1, -0.42, 0.08], [-0.42, 0.35, 0.09], [0.45, -0.1, 0.06]].forEach(
        ([ox, oy, or_]) => {
          ctx.beginPath();
          ctx.arc(cx + ox * R, cy + oy * R, or_ * R, 0, Math.PI * 2);
          ctx.fill();
        }
      );
      if (eclipse) {
        ctx.fillStyle = "rgba(160, 40, 28, 0.55)";
        ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
      }
      ctx.restore();

      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(212,175,55,0.25)";
      ctx.lineWidth = devicePixelRatio;
      ctx.stroke();

      const pulse = (t % 240) / 240;
      ctx.beginPath();
      ctx.arc(cx, cy, R * (1 + pulse * 0.35), 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(200,50,43,${0.35 * (1 - pulse)})`;
      ctx.lineWidth = 1.5 * devicePixelRatio;
      ctx.stroke();

      particles.forEach((pt) => {
        pt.a += pt.s;
        const px = cx + Math.cos(pt.a) * R * pt.r * 1.6;
        const py = cy + Math.sin(pt.a) * R * pt.r * 0.9 + Math.sin(t * 0.01 + pt.a) * 6;
        ctx.beginPath();
        ctx.arc(px, py, pt.size * devicePixelRatio, 0, Math.PI * 2);
        ctx.fillStyle = pt.gold ? "rgba(212,175,55,0.7)" : "rgba(200,50,43,0.6)";
        ctx.fill();
      });

      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className={`h-full w-full ${className}`} data-testid="hero-moon-canvas" />;
};
