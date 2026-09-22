import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Instagram, Send, Loader2 } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { INSTAGRAM_URL } from "@/data/content";

// Same-origin Cloudflare Pages Function (frontend/functions/api/enquiries.js).
const API = "/api";

const SERVICE_OPTIONS = [
  { id: "Web Design & Build", testid: "enquiry-select-service-website" },
  { id: "Logo & Brand", testid: "enquiry-select-service-logo" },
  { id: "Banners & Media", testid: "enquiry-select-service-banner" },
  { id: "Domains & DNS", testid: "enquiry-select-service-domain" },
  { id: "Hosting & Care", testid: "enquiry-select-service-hosting" },
];

const EMPTY_FORM = { name: "", email: "", phone: "", budget: "", message: "", company: "" };

export default function Enquiry() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [services, setServices] = useState([]);
  const [sending, setSending] = useState(false);

  const toggleService = (id) =>
    setServices((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));

  const submit = async (e) => {
    e.preventDefault();
    if (sending) return;
    setSending(true);
    try {
      await axios.post(`${API}/enquiries`, { ...form, services });
      toast.success("Enquiry received. We'll be in touch within one orbit — 24 hours.", {
        duration: 5000,
      });
      setForm(EMPTY_FORM);
      setServices([]);
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Transmission failed. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const inputCls =
    "w-full rounded-xl border border-white/10 bg-[#0E0E14] px-5 py-4 text-sm text-[#F4F1EA] placeholder-[#68645D] outline-none transition-all duration-300 focus:border-[color-mix(in_srgb,var(--gold)_60%,transparent)] focus:bg-[#13131A]";

  return (
    <main className="mx-auto max-w-6xl px-6 pb-28 pt-40" data-testid="enquiry-page">
      <div className="grid gap-16 lg:grid-cols-5">
        <Reveal className="lg:col-span-2">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-[var(--red)]">Enquiry</p>
          <h1 className="font-display mt-4 text-4xl leading-[1.08] tracking-tight sm:text-5xl">
            Begin the <span className="text-[var(--gold)]">ascent</span>.
          </h1>
          <p className="mt-6 max-w-md text-lg font-light leading-relaxed text-[#A39E93]">
            Tell us what you're building. We respond to every serious enquiry within one business day with a scoped
            plan and honest pricing.
          </p>

          <div className="mt-10 space-y-5">
            <div className="rounded-2xl border border-white/10 bg-[#13131A] p-6">
              <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-[#68645D]">Response window</p>
              <p className="font-display mt-2 text-xl text-[#F4F1EA]">Within 24 hours</p>
            </div>
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="enquiry-instagram-link"
              className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#13131A] p-6 transition-all duration-300 hover:border-[color-mix(in_srgb,var(--red)_50%,transparent)]"
            >
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-[#68645D]">Follow the studio</p>
                <p className="font-display mt-2 text-xl text-[#F4F1EA]">@lunardesignsolutions</p>
              </div>
              <Instagram size={22} className="text-[var(--red)]" />
            </a>
          </div>
        </Reveal>

        <Reveal delay={0.15} className="lg:col-span-3">
          <form onSubmit={submit} data-testid="enquiry-form" className="rounded-3xl border border-white/10 bg-[#0E0E14] p-8">
            <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-[var(--gold)]">What do you need?</p>
            <div className="mt-4 flex flex-wrap gap-2.5">
              {SERVICE_OPTIONS.map((s) => (
                <button
                  type="button"
                  key={s.id}
                  data-testid={s.testid}
                  onClick={() => toggleService(s.id)}
                  className={`rounded-full border px-4 py-2 text-xs font-medium transition-all duration-300 ${
                    services.includes(s.id)
                      ? "border-[var(--red)] bg-[color-mix(in_srgb,var(--red)_15%,transparent)] text-[#F4F1EA]"
                      : "border-white/10 text-[#A39E93] hover:border-white/30"
                  }`}
                >
                  {s.id}
                </button>
              ))}
            </div>

            <label
              htmlFor="enquiry-budget"
              className="mt-8 block font-mono text-[11px] uppercase tracking-[0.25em] text-[var(--gold)]"
            >
              What's your budget?
            </label>
            <input
              id="enquiry-budget"
              data-testid="enquiry-input-budget"
              placeholder="Roughly what you had in mind"
              maxLength={120}
              value={form.budget}
              onChange={(e) => setForm({ ...form, budget: e.target.value })}
              className={`${inputCls} mt-4`}
            />

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <input
                required
                data-testid="enquiry-input-name"
                placeholder="Your name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={inputCls}
              />
              <input
                required
                type="email"
                data-testid="enquiry-input-email"
                placeholder="Email address"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={inputCls}
              />
            </div>
            <input
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              data-testid="enquiry-input-phone"
              placeholder="Mobile number (optional)"
              maxLength={40}
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className={`${inputCls} mt-4`}
            />
            <textarea
              required
              rows={5}
              data-testid="enquiry-input-message"
              placeholder="Project brief — goals, timeline, references…"
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              className={`${inputCls} mt-4 resize-none`}
            />

            {/* Spam honeypot: hidden from people, often filled in by bots. */}
            <input
              type="text"
              name="company"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
              className="hidden"
            />

            <button
              type="submit"
              disabled={sending}
              data-testid="enquiry-submit-button"
              className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--red)] px-8 py-4 text-sm font-semibold uppercase tracking-[0.12em] text-[#F4F1EA] transition-all duration-300 hover:bg-[var(--gold)] hover:text-[#08080B] disabled:opacity-60 sm:w-auto"
            >
              {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              {sending ? "Transmitting…" : "Launch Enquiry"}
            </button>
          </form>
        </Reveal>
      </div>
    </main>
  );
}
