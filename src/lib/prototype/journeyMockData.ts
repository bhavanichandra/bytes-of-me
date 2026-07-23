// PROTOTYPE-ONLY mock data for the journey/log grid exploration.
export interface JourneyDay {
  date: string; // yyyy-mm-dd
  worked: boolean;
  campaign?: string;
  quest?: string;
  note?: string;
}

export const CAMPAIGNS: Record<string, { label: string; color: string }> = {
  "ai-foundations": { label: "AI Foundations", color: "#22d3ee" },
  "nlp-transformers": { label: "NLP & Transformers", color: "#f472b6" },
  "systems-arch": { label: "Systems & Architecture", color: "#f87171" },
};

const CAMPAIGN_KEYS = Object.keys(CAMPAIGNS);
const NOTES = [
  "Worked through backprop by hand on a 2-layer net.",
  "Read the attention-is-all-you-need paper, took notes.",
  "Implemented a toy LSM tree, hit a bug in compaction.",
  "Drafted the blog post outline for this Sub Quest.",
  "Debugged gradient explosion, added clipping.",
  "Paired the Quest reading with the worked problem.",
];

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export function buildMockDays(days = 182): JourneyDay[] {
  const rand = seededRandom(42);
  const out: JourneyDay[] = [];
  const today = new Date("2026-07-24");
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const worked = rand() < 0.55;
    out.push({
      date: d.toISOString().slice(0, 10),
      worked,
      campaign: worked ? CAMPAIGN_KEYS[Math.floor(rand() * CAMPAIGN_KEYS.length)] : undefined,
      quest: worked ? `Sub Quest ${Math.floor(rand() * 4) + 1}` : undefined,
      note: worked && rand() < 0.4 ? NOTES[Math.floor(rand() * NOTES.length)] : undefined,
    });
  }
  return out;
}

export function currentStreak(days: JourneyDay[]): number {
  let streak = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    if (!days[i].worked) break;
    streak++;
  }
  return streak;
}

export function bestStreak(days: JourneyDay[]): number {
  let best = 0;
  let run = 0;
  for (const d of days) {
    run = d.worked ? run + 1 : 0;
    best = Math.max(best, run);
  }
  return best;
}
