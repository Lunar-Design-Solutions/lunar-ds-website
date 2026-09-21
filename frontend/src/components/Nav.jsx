import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Instagram, Menu, X } from "lucide-react";
import { INSTAGRAM_URL } from "@/data/content";

const LINKS = [
  { to: "/work", label: "Work", testid: "nav-link-work" },
  { to: "/#manifesto", label: "Manifesto", testid: "nav-link-manifesto" },
  { to: "/#services", label: "Services", testid: "nav-link-services" },
  { to: "/about", label: "About", testid: "nav-link-about" },
];

export const Nav = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  return (
    <header className="fixed inset-x-0 top-4 z-50 flex justify-center px-4">
      <nav className="flex w-full max-w-5xl items-center justify-between rounded-full border border-white/10 bg-[#08080B]/80 px-5 py-3 backdrop-blur-xl">
        <Link to="/" data-testid="header-logo" className="flex items-center gap-3" onClick={() => setOpen(false)}>
          <img src="/logo.png" alt="Lunar Design" className="h-9 w-9 rounded-lg" />
          <span className="font-display hidden text-lg tracking-wide sm:block">Lunar Design</span>
        </Link>

        <div className="hidden items-center gap-7 md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              data-testid={l.testid}
              className={`text-xs font-medium uppercase tracking-[0.2em] transition-colors duration-300 hover:text-[#D4AF37] ${
                location.pathname === l.to ? "text-[#D4AF37]" : "text-[#A39E93]"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="instagram-social-link"
            aria-label="Lunar Design on Instagram"
            className="hidden h-9 w-9 items-center justify-center rounded-full border border-white/10 text-[#A39E93] transition-all duration-300 hover:border-[#C8322B] hover:text-[#C8322B] sm:flex"
          >
            <Instagram size={15} />
          </a>
          <Link
            to="/enquiry"
            data-testid="nav-link-enquiry"
            className="rounded-full bg-[#F4F1EA] px-5 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-[#08080B] transition-all duration-300 hover:bg-[#D4AF37]"
          >
            Start a Project
          </Link>
          <button
            data-testid="mobile-menu-toggle"
            aria-label="Toggle menu"
            onClick={() => setOpen(!open)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 md:hidden"
          >
            {open ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
            className="absolute top-20 w-[calc(100%-2rem)] max-w-5xl rounded-3xl border border-white/10 bg-[#0E0E14]/95 p-6 backdrop-blur-xl md:hidden"
          >
            {[...LINKS, { to: "/enquiry", label: "Enquiry", testid: "nav-link-enquiry-mobile" }].map((l) => (
              <Link
                key={l.testid}
                to={l.to}
                data-testid={l.testid}
                onClick={() => setOpen(false)}
                className="font-display block border-b border-white/5 py-4 text-2xl text-[#F4F1EA] last:border-0"
              >
                {l.label}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
