import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Instagram } from "lucide-react";
import { INSTAGRAM_URL } from "@/data/content";

export const Footer = () => {
  const [time, setTime] = useState("");

  useEffect(() => {
    const tick = () =>
      setTime(new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-[#0E0E14]">
      <div className="pointer-events-none absolute -bottom-24 left-1/2 -translate-x-1/2 select-none">
        <span className="font-display text-stroke-gold text-[26vw] leading-none tracking-tight">LUNAR</span>
      </div>

      <div className="relative mx-auto grid max-w-6xl gap-12 px-6 py-20 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Lunar Design" className="h-10 w-10 rounded-lg" />
            <span className="font-display text-xl">Lunar Design</span>
          </div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-[#A39E93]">
            Architects of high-end digital presence. Websites, logos, banners, domains and hosting — built to command
            attention.
          </p>
        </div>

        <div>
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-[#C8322B]">Navigate</p>
          <div className="mt-5 flex flex-col gap-3">
            {[
              { to: "/work", label: "Portfolio" },
              { to: "/about", label: "About the Studio" },
              { to: "/enquiry", label: "Start a Project" },
            ].map((l) => (
              <Link
                key={l.to}
                to={l.to}
                data-testid={`footer-link-${l.label.toLowerCase().replace(/\s+/g, "-")}`}
                className="text-sm text-[#A39E93] transition-colors duration-300 hover:text-[var(--gold)]"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-[#C8322B]">Connect</p>
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="footer-instagram-link"
            className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/10 px-5 py-2.5 text-sm text-[#F4F1EA] transition-all duration-300 hover:border-[#C8322B] hover:text-[#C8322B]"
          >
            <Instagram size={15} /> @lunardesignsolutions
          </a>
          <p className="mt-6 font-mono text-xs text-[#68645D]" data-testid="footer-local-time">
            LOCAL TIME — {time}
          </p>
        </div>
      </div>

      <div className="relative border-t border-white/5 py-6 text-center font-mono text-[11px] uppercase tracking-[0.3em] text-[#68645D]">
        © {new Date().getFullYear()} Lunar Design — All orbits reserved
      </div>
    </footer>
  );
};
