const SYNODIC = 29.530588853;
const KNOWN_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14);

const NAMES = [
  "New Moon",
  "Waxing Crescent",
  "First Quarter",
  "Waxing Gibbous",
  "Full Moon",
  "Waning Gibbous",
  "Last Quarter",
  "Waning Crescent",
];

export const getMoonPhase = (date = new Date()) => {
  const days = (date.getTime() - KNOWN_NEW_MOON) / 86400000;
  const phase = (((days % SYNODIC) + SYNODIC) % SYNODIC) / SYNODIC;
  const illumination = Math.round(((1 - Math.cos(2 * Math.PI * phase)) / 2) * 100);
  const name = NAMES[Math.round(phase * 8) % 8];
  return { phase, illumination, name };
};

// Accents follow the lunar cycle: warm amber at full moon, muted stone at new moon
export const getPhaseGold = (date = new Date()) => {
  const { illumination } = getMoonPhase(date);
  const t = illumination / 100;
  const h = Math.round(46 - 14 * t);
  const s = Math.round(20 + 59 * t);
  const l = Math.round(45 + 9 * t);
  return `hsl(${h} ${s}% ${l}%)`;
};

export const getPhaseRed = (date = new Date()) => {
  const { illumination } = getMoonPhase(date);
  const t = illumination / 100;
  const s = Math.round(30 + 36 * t);
  const l = Math.round(40 + 7 * t);
  return `hsl(3 ${s}% ${l}%)`;
};

export const getNextFullMoon = (date = new Date()) => {
  const { phase } = getMoonPhase(date);
  const daysTo = phase < 0.5 ? (0.5 - phase) * SYNODIC : (1.5 - phase) * SYNODIC;
  return new Date(date.getTime() + daysTo * 86400000);
};
