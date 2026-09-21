import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, X } from "lucide-react";
import { PORTFOLIO } from "@/data/content";
import { EASE, Reveal } from "@/components/Reveal";

const CATEGORIES = ["all", ...new Set(PORTFOLIO.map((p) => p.category))];

const shotSrc = (p) => `${process.env.REACT_APP_BACKEND_URL}/api/screenshots/${p.id}.png`;
const shotFallback = (p) => (e) => {
  if (e.currentTarget.dataset.fb) return;
  e.currentTarget.dataset.fb = "1";
  e.currentTarget.src = p.image;
};

export const PortfolioGrid = ({ limit }) => {
  const [filter, setFilter] = useState("all");
  const [active, setActive] = useState(null);

  const items = PORTFOLIO.filter((p) => filter === "all" || p.category === filter).slice(0, limit || 99);

  return (
    <div>
      {CATEGORIES.length > 2 && (
        <div className="mb-10 flex flex-wrap gap-3">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              data-testid={`portfolio-filter-${c === "all" ? "all" : c.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
              onClick={() => setFilter(c)}
              className={`rounded-full border px-5 py-2 text-xs font-medium uppercase tracking-[0.15em] transition-all duration-300 ${
                filter === c
                  ? "border-[var(--gold)] bg-[var(--gold)]/10 text-[var(--gold)]"
                  : "border-white/10 text-[#A39E93] hover:border-white/30 hover:text-[#F4F1EA]"
              }`}
            >
              {c === "all" ? "All" : c}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {items.map((p, i) => (
            <motion.button
              layout
              key={p.id}
              data-testid={`portfolio-card-${i}`}
              onClick={() => setActive(p)}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.6, ease: EASE }}
              className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-[#13131A] text-left ${
                p.span === "wide" ? "md:col-span-2" : ""
              }`}
            >
              <div className="relative aspect-[16/10] overflow-hidden">
                <img
                  src={shotSrc(p)}
                  onError={shotFallback(p)}
                  alt={p.title}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#08080B] via-transparent to-transparent" />
                <div className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-[#08080B]/60 opacity-0 backdrop-blur transition-all duration-300 group-hover:opacity-100">
                  <ArrowUpRight size={16} className="text-[var(--gold)]" />
                </div>
              </div>
              <div className="p-6">
                <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-[#C8322B]">{p.category}</p>
                <h3 className="font-display mt-2 text-2xl text-[#F4F1EA]">{p.title}</h3>
                <p className="mt-1 text-sm text-[#A39E93]">{p.subtitle}</p>
              </div>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] flex items-end justify-center bg-[#08080B]/80 backdrop-blur-md sm:items-center sm:p-6"
            onClick={() => setActive(null)}
            data-testid="portfolio-modal-overlay"
          >
            <motion.div
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 80, opacity: 0 }}
              transition={{ duration: 0.5, ease: EASE }}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-t-3xl border border-white/10 bg-[#0E0E14] sm:rounded-3xl"
              data-testid="portfolio-modal"
            >
              <div className="relative">
                <img src={shotSrc(active)} onError={shotFallback(active)} alt={active.title} className="aspect-[16/8] w-full object-cover" />
                <button
                  data-testid="portfolio-modal-close-button"
                  onClick={() => setActive(null)}
                  aria-label="Close case study"
                  className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-[#08080B]/70 text-[#F4F1EA] backdrop-blur transition-colors hover:bg-[#C8322B]"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="p-8">
                <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-[#C8322B]">{active.category}</p>
                <h3 className="font-display mt-2 text-4xl">{active.title}</h3>
                <p className="mt-1 text-[#A39E93]">{active.subtitle}</p>

                <div className="mt-6 flex flex-wrap gap-3">
                  {active.metrics.map((m) => (
                    <span
                      key={m}
                      className="rounded-full border border-[var(--gold)]/40 bg-[var(--gold)]/10 px-4 py-1.5 font-mono text-xs text-[var(--gold)]"
                    >
                      {m}
                    </span>
                  ))}
                </div>

                <div className="mt-6 flex flex-wrap gap-2">
                  {active.stack.map((s) => (
                    <span key={s} className="rounded-md bg-[#16161F] px-3 py-1.5 text-xs text-[#A39E93]">
                      {s}
                    </span>
                  ))}
                </div>

                <p className="mt-8 text-base leading-relaxed text-[#A39E93]">{active.blurb}</p>

                <div className="mt-6 rounded-xl border border-dashed border-white/15 p-5" data-testid="portfolio-testimonial-slot">
                  <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#68645D]">Client words</p>
                  <p className="font-display mt-2 italic text-[#A39E93]">
                    {active.quote || "Testimonial coming soon — the client's own words land here."}
                  </p>
                </div>
                {active.link && (
                  <a
                    href={active.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-testid="portfolio-modal-live-link"
                    className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#F4F1EA] px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-[#08080B] transition-colors duration-300 hover:bg-[var(--gold)]"
                  >
                    Visit live site <ArrowUpRight size={14} />
                  </a>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
