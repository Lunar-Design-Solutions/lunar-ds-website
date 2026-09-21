import { MARQUEE_ITEMS } from "@/data/content";

export const Marquee = () => {
  const row = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS];
  return (
    <div className="overflow-hidden border-y border-white/10 py-5" data-testid="services-marquee">
      <div className="animate-marquee flex w-max items-center">
        {[0, 1].map((half) => (
          <div key={half} className="flex shrink-0 items-center">
            {row.map((item, i) => (
              <span
                key={`${half}-${i}`}
                className="font-display flex items-center whitespace-nowrap px-8 text-lg tracking-wide text-[#A39E93]"
              >
                <span className="mr-8 text-[var(--gold)]">✦</span>
                {item}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
