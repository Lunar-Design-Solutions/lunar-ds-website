import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/Reveal";

const STATS = [
  { value: "2", label: "Live client sites" },
  { value: "1", label: "Point of contact" },
  { value: "0", label: "Account managers" },
  { value: "24/7", label: "Monitoring & care" },
];

const CAPABILITIES = [
  "Art direction & bespoke web design",
  "Logo systems & brand books",
  "Campaign banners & social kits",
  "Domain acquisition & DNS architecture",
  "Managed hosting, SSL & backups",
  "Ongoing maintenance & performance tuning",
];

export default function About() {
  return (
    <main className="mx-auto max-w-6xl px-6 pb-28 pt-40" data-testid="about-page">
      <Reveal>
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-[var(--red)]">About the Studio</p>
        <h1 className="font-display mt-4 max-w-3xl text-4xl leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
          A family studio with <span className="text-[var(--gold)]">orbital reach</span>.
        </h1>
      </Reveal>

      <div className="mt-16 grid gap-12 lg:grid-cols-2">
        <Reveal className="space-y-6 text-lg font-light leading-relaxed text-[#A39E93]">
          <p>
            Lunar Design is a family-run freelance studio — no account managers, no hand-offs, no agency theatre.
            The same people who sketch your identity also build your site, register your domain and keep your
            hosting humming long after launch day.
          </p>
          <p>
            Most agencies hand you a design file and disappear. As a family business we stay in orbit: deploying,
            maintaining, tuning and evolving your digital presence so it never drifts into the dark — and when you
            call, you speak directly to the person who built it.
          </p>
          <p className="font-display text-xl text-[#F4F1EA]">
            Design is the signal. Infrastructure is the gravity. We deliver both.
          </p>
        </Reveal>

        <Reveal delay={0.15}>
          <div className="overflow-hidden rounded-2xl border border-white/10">
            <img
              src="https://images.pexels.com/photos/16323580/pexels-photo-16323580.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
              alt="Lunar Design studio workspace"
              className="aspect-[4/3] w-full object-cover"
              loading="lazy"
            />
          </div>
        </Reveal>
      </div>

      <div className="mt-20 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 md:grid-cols-4">
        {STATS.map((s, i) => (
          <Reveal key={s.label} delay={i * 0.1} className="bg-[#0E0E14]">
            <div className="p-8 text-center" data-testid={`about-stat-${i}`}>
              <p className="font-display text-3xl text-[var(--gold)] sm:text-4xl">{s.value}</p>
              <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.2em] text-[#68645D]">{s.label}</p>
            </div>
          </Reveal>
        ))}
      </div>

      <div className="mt-20">
        <Reveal>
          <h2 className="font-display text-3xl tracking-tight sm:text-4xl">Everything under one moon.</h2>
        </Reveal>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CAPABILITIES.map((c, i) => (
            <Reveal key={c} delay={i * 0.07}>
              <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-[#13131A] p-5" data-testid={`about-capability-${i}`}>
                <span className="font-mono text-xs text-[var(--gold)]">{String(i + 1).padStart(2, "0")}</span>
                <span className="text-sm text-[#F4F1EA]">{c}</span>
              </div>
            </Reveal>
          ))}
        </div>
      </div>

      <Reveal className="mt-24 text-center">
        <Link
          to="/enquiry"
          data-testid="about-cta-button"
          className="inline-flex items-center gap-2 rounded-full bg-[#F4F1EA] px-9 py-4 text-sm font-semibold uppercase tracking-[0.12em] text-[#08080B] transition-all duration-300 hover:bg-[var(--gold)]"
        >
          Work with us <ArrowRight size={16} />
        </Link>
      </Reveal>
    </main>
  );
}
