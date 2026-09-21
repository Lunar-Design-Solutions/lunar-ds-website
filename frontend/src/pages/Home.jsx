import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, ArrowDown } from "lucide-react";
import { useRef } from "react";
import { MoonCanvas } from "@/components/MoonCanvas";
import { Marquee } from "@/components/Marquee";
import { PortfolioGrid } from "@/components/PortfolioGrid";
import { EASE, MaskedLine, Reveal } from "@/components/Reveal";
import { MANIFESTO, SERVICES } from "@/data/content";
import { getMoonPhase } from "@/utils/moonphase";

const Hero = () => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const moonY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const textY = useTransform(scrollYProgress, [0, 1], [0, -60]);

  return (
    <section ref={ref} className="relative flex min-h-screen items-center overflow-hidden pt-28" data-testid="hero-section">
      <motion.div style={{ y: moonY }} className="absolute inset-y-0 right-0 hidden w-1/2 lg:block">
        <MoonCanvas />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-white/10 bg-[#08080B]/70 px-4 py-2 backdrop-blur"
          data-testid="hero-moon-phase"
        >
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#A39E93]">
            Tonight — <span className="text-[var(--gold)]">{getMoonPhase().name}</span> · {getMoonPhase().illumination}% lit
          </span>
        </motion.div>
      </motion.div>

      <motion.div style={{ y: textY }} className="relative z-10 mx-auto w-full max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: EASE }}
          className="mb-8 inline-flex items-center gap-2.5 rounded-full border border-[#C8322B]/40 bg-[#C8322B]/10 px-4 py-1.5"
          data-testid="hero-status-pill"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#C8322B] opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#C8322B]" />
          </span>
          <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-[#F4F1EA]">
            Open for Q3/Q4 commissions
          </span>
        </motion.div>

        <h1 className="font-display max-w-3xl text-4xl leading-[1.08] tracking-tight sm:text-6xl lg:text-7xl">
          <MaskedLine delay={0.35}>We craft digital</MaskedLine>
          <MaskedLine delay={0.5}>
            <span className="text-[var(--gold)]">monuments</span> that
          </MaskedLine>
          <MaskedLine delay={0.65}>command attention.</MaskedLine>
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.95, ease: EASE }}
          className="mt-7 max-w-xl text-lg font-light leading-relaxed text-[#A39E93] sm:text-xl"
        >
          Lunar Design builds award-grade websites, brand logos, campaign banners — and runs the domains and hosting
          beneath them. Design, deployed and maintained.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 1.1, ease: EASE }}
          className="mt-10 flex flex-wrap items-center gap-4"
        >
          <Link
            to="/work"
            data-testid="hero-explore-work-button"
            className="group inline-flex items-center gap-2 rounded-full bg-[#F4F1EA] px-7 py-3.5 text-sm font-semibold uppercase tracking-[0.12em] text-[#08080B] transition-all duration-300 hover:bg-[var(--gold)]"
          >
            Explore Portfolio
            <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
          <Link
            to="/enquiry"
            data-testid="hero-start-project-button"
            className="inline-flex items-center gap-2 rounded-full border border-white/20 px-7 py-3.5 text-sm font-medium uppercase tracking-[0.12em] text-[#F4F1EA] transition-all duration-300 hover:border-[#C8322B] hover:text-[#C8322B]"
          >
            Send Enquiry
          </Link>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6, duration: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[#68645D]"
      >
        <ArrowDown size={18} className="animate-bounce" />
      </motion.div>
    </section>
  );
};

const Manifesto = () => (
  <section id="manifesto" className="mx-auto max-w-6xl scroll-mt-28 px-6 py-28" data-testid="manifesto-section">
    <Reveal>
      <p className="font-mono text-xs uppercase tracking-[0.25em] text-[#C8322B]">The Lunar Manifesto</p>
      <h2 className="font-display mt-4 max-w-2xl text-3xl tracking-tight sm:text-4xl lg:text-5xl">
        Three laws every project obeys.
      </h2>
    </Reveal>

    <div className="mt-16 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 md:grid-cols-3">
      {MANIFESTO.map((c, i) => (
        <Reveal key={c.num} delay={i * 0.15} className="bg-[#0E0E14]">
          <article className="group h-full p-8 transition-colors duration-500 hover:bg-[#13131A]" data-testid={`manifesto-chapter-${c.num}`}>
            <span className="font-mono text-sm tracking-widest text-[var(--gold)]">{c.num}</span>
            <div className="mt-6 h-px w-10 bg-[var(--gold)]/50 transition-all duration-500 group-hover:w-full" />
            <h3 className="font-display mt-6 text-xl text-[#F4F1EA] sm:text-2xl">{c.heading}</h3>
            <p className="mt-4 text-sm leading-relaxed text-[#A39E93]">{c.text}</p>
          </article>
        </Reveal>
      ))}
    </div>
  </section>
);

const Services = () => (
  <section id="services" className="mx-auto max-w-6xl scroll-mt-28 px-6 py-28" data-testid="services-section">
    <Reveal className="flex flex-wrap items-end justify-between gap-6">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-[#C8322B]">Capabilities</p>
        <h2 className="font-display mt-4 text-3xl tracking-tight sm:text-4xl lg:text-5xl">
          From first sketch to always-on.
        </h2>
      </div>
      <p className="max-w-sm text-sm leading-relaxed text-[#A39E93]">
        One studio for the entire lifecycle — identity, interface, infrastructure and ongoing care.
      </p>
    </Reveal>

    <div className="mt-16 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      {SERVICES.map((s, i) => (
        <Reveal key={s.id} delay={i * 0.08} className={i === 0 ? "lg:col-span-2" : ""}>
          <article
            data-testid={`service-card-${s.id}`}
            className="group h-full rounded-2xl border border-white/10 bg-[#13131A] p-8 transition-all duration-500 hover:border-[var(--gold)]/40 hover:bg-[#1A1A24]"
          >
            <p className="font-mono text-[11px] tracking-[0.25em] text-[#68645D]">{s.tag}</p>
            <h3 className="font-display mt-4 text-xl text-[#F4F1EA] transition-colors duration-300 group-hover:text-[var(--gold)] sm:text-2xl">
              {s.title}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-[#A39E93]">{s.desc}</p>
          </article>
        </Reveal>
      ))}
      <Reveal delay={0.4}>
        <Link
          to="/enquiry"
          data-testid="services-cta-card"
          className="group flex h-full min-h-[180px] flex-col justify-between rounded-2xl border border-[#C8322B]/40 bg-[#C8322B]/10 p-8 transition-all duration-500 hover:bg-[#C8322B]/20"
        >
          <p className="font-mono text-[11px] tracking-[0.25em] text-[#C8322B]">06 / YOURS</p>
          <div className="flex items-center justify-between">
            <span className="font-display text-xl sm:text-2xl">Commission the next one</span>
            <ArrowRight size={20} className="text-[#C8322B] transition-transform duration-300 group-hover:translate-x-1.5" />
          </div>
        </Link>
      </Reveal>
    </div>
  </section>
);

const WorkPreview = () => (
  <section className="mx-auto max-w-6xl px-6 py-28" data-testid="work-preview-section">
    <Reveal className="mb-14 flex flex-wrap items-end justify-between gap-6">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-[#C8322B]">Selected Work</p>
        <h2 className="font-display mt-4 text-3xl tracking-tight sm:text-4xl lg:text-5xl">Recent orbits.</h2>
      </div>
      <Link
        to="/work"
        data-testid="work-preview-view-all"
        className="group inline-flex items-center gap-2 text-sm uppercase tracking-[0.15em] text-[#A39E93] transition-colors hover:text-[var(--gold)]"
      >
        View all work
        <ArrowRight size={15} className="transition-transform duration-300 group-hover:translate-x-1" />
      </Link>
    </Reveal>
    <PortfolioGrid limit={3} />
  </section>
);

const CTABand = () => (
  <section className="border-t border-white/10 px-6 py-32 text-center" data-testid="cta-band">
    <Reveal>
      <p className="font-mono text-xs uppercase tracking-[0.25em] text-[var(--gold)]">The next phase</p>
      <h2 className="font-display mx-auto mt-6 max-w-3xl text-4xl leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
        Your brand deserves a <span className="text-[#C8322B]">gravitational pull</span>.
      </h2>
      <Link
        to="/enquiry"
        data-testid="cta-band-button"
        className="mt-10 inline-flex items-center gap-2 rounded-full bg-[#C8322B] px-9 py-4 text-sm font-semibold uppercase tracking-[0.12em] text-[#F4F1EA] transition-all duration-300 hover:bg-[var(--gold)] hover:text-[#08080B]"
      >
        Start a Project <ArrowRight size={16} />
      </Link>
    </Reveal>
  </section>
);

export default function Home() {
  return (
    <main>
      <Hero />
      <Marquee />
      <Manifesto />
      <Services />
      <WorkPreview />
      <CTABand />
    </main>
  );
}
