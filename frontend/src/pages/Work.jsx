import { PortfolioGrid } from "@/components/PortfolioGrid";
import { Reveal } from "@/components/Reveal";

export default function Work() {
  return (
    <main className="mx-auto max-w-6xl px-6 pb-28 pt-40" data-testid="work-page">
      <Reveal>
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-[#C8322B]">Portfolio</p>
        <h1 className="font-display mt-4 max-w-3xl text-4xl leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
          Work that left the <span className="text-[#D4AF37]">atmosphere</span>.
        </h1>
        <p className="mt-6 max-w-xl text-lg font-light leading-relaxed text-[#A39E93]">
          Websites, identities, campaigns and the infrastructure beneath them. Open any case for the metrics and the
          story.
        </p>
      </Reveal>
      <div className="mt-14">
        <PortfolioGrid />
      </div>
    </main>
  );
}
