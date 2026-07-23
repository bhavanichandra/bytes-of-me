// PROTOTYPE-ONLY mock data for the journey/log grid exploration.
export interface JourneyDay {
  date: string; // yyyy-mm-dd
  worked: boolean;
  campaign?: string;
  quest?: string;
  questType?: "sub" | "side";
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

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export function buildMockDays(year = 2026): JourneyDay[] {
  const rand = seededRandom(42);
  const out: JourneyDay[] = [];
  const today = new Date("2026-07-24");
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31);
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = toDateStr(d);
    const isFuture = d > today;
    const worked = !isFuture && rand() < 0.55;
    const questType: "sub" | "side" = rand() < 0.8 ? "sub" : "side";
    out.push({
      date: dateStr,
      worked,
      campaign: worked ? CAMPAIGN_KEYS[Math.floor(rand() * CAMPAIGN_KEYS.length)] : undefined,
      quest: worked ? `${questType === "sub" ? "Sub Quest" : "Side Quest"} ${Math.floor(rand() * 4) + 1}` : undefined,
      questType: worked ? questType : undefined,
      note: worked && rand() < 0.4 ? NOTES[Math.floor(rand() * NOTES.length)] : undefined,
    });
  }
  return out;
}

export interface JourneyMonth {
  key: string; // yyyy-mm
  label: string; // "July 2026"
  weeks: (JourneyDay | null)[][]; // Mon-Sun rows, null = outside this month
}

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export { WEEKDAY_LABELS };

export function groupByMonth(days: JourneyDay[]): JourneyMonth[] {
  const byKey = new Map<string, JourneyDay[]>();
  for (const day of days) {
    const key = day.date.slice(0, 7);
    if (!byKey.has(key)) byKey.set(key, []);
    byKey.get(key)!.push(day);
  }

  return [...byKey.entries()].map(([key, monthDays]) => {
    const [year, month] = key.split("-").map(Number);
    const label = new Date(year, month - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
    const byDate = new Map(monthDays.map((d) => [d.date, d]));
    const daysInMonth = new Date(year, month, 0).getDate();

    const cells: (JourneyDay | null)[] = [];
    const firstWeekday = (new Date(year, month - 1, 1).getDay() + 6) % 7; // Mon=0
    for (let i = 0; i < firstWeekday; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${key}-${String(d).padStart(2, "0")}`;
      cells.push(byDate.get(dateStr) ?? null);
    }
    while (cells.length % 7 !== 0) cells.push(null);

    const weeks: (JourneyDay | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

    return { key, label, weeks };
  });
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
