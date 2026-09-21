import { useEffect, useRef } from "react";

export const MoonCanvas = ({ className = "" }) => {
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
      const cx = W / 2 + mouse.current.x * 18 * devicePixelRatio;
      const cy = H / 2 + mouse.current.y * 18 * devicePixelRatio;
      const R = Math.min(W, H) * 0.3;

      ctx.clearRect(0, 0, W, H);

      // ambient glow
      const glow = ctx.createRadialGradient(cx, cy, R * 0.4, cx, cy, R * 2.4);
      glow.addColorStop(0, "rgba(212,175,55,0.10)");
      glow.addColorStop(0.5, "rgba(200,50,43,0.05)");
      glow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, W, H);

      // gold orbit ring
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(-0.35 + Math.sin(t * 0.004) * 0.05 + mouse.current.x * 0.06);
      ctx.beginPath();
      ctx.ellipse(0, 0, R * 1.45, R * 0.42, 0, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(212,175,55,0.4)";
      ctx.lineWidth = 1.2 * devicePixelRatio;
      ctx.stroke();
      ctx.restore();

      // moon body
      const body = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.35, R * 0.1, cx, cy, R);
      body.addColorStop(0, "#f4f1ea");
      body.addColorStop(0.55, "#b9b4a8");
      body.addColorStop(0.85, "#55524c");
      body.addColorStop(1, "#1a1a20");
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fillStyle = body;
      ctx.fill();

      // craters
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.clip();
      ctx.fillStyle = "rgba(0,0,0,0.14)";
      [[-0.3, -0.15, 0.14], [0.25, 0.3, 0.1], [0.1, -0.42, 0.08], [-0.42, 0.35, 0.09], [0.45, -0.1, 0.06]].forEach(
        ([ox, oy, or_]) => {
          ctx.beginPath();
          ctx.arc(cx + ox * R, cy + oy * R, or_ * R, 0, Math.PI * 2);
          ctx.fill();
        }
      );
      // shadow terminator
      const shadow = ctx.createRadialGradient(cx + R * 0.9, cy + R * 0.4, R * 0.2, cx, cy, R * 1.6);
      shadow.addColorStop(0, "rgba(8,8,11,0.85)");
      shadow.addColorStop(0.6, "rgba(8,8,11,0.35)");
      shadow.addColorStop(1, "rgba(8,8,11,0)");
      ctx.fillStyle = shadow;
      ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
      ctx.restore();

      // crimson pulse
      const pulse = (t % 240) / 240;
      ctx.beginPath();
      ctx.arc(cx, cy, R * (1 + pulse * 0.35), 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(200,50,43,${0.35 * (1 - pulse)})`;
      ctx.lineWidth = 1.5 * devicePixelRatio;
      ctx.stroke();

      // particles
      particles.forEach((p) => {
        p.a += p.s;
        const px = cx + Math.cos(p.a) * R * p.r * 1.6;
        const py = cy + Math.sin(p.a) * R * p.r * 0.9 + Math.sin(t * 0.01 + p.a) * 6;
        ctx.beginPath();
        ctx.arc(px, py, p.size * devicePixelRatio, 0, Math.PI * 2);
        ctx.fillStyle = p.gold ? "rgba(212,175,55,0.7)" : "rgba(200,50,43,0.6)";
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

  return <canvas ref={canvasRef} className={`h-full w-full ${className}`} data-testid="hero-moon-canvas" />;
};
