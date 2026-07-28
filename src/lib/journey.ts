import { campaignColor, campaignLabel } from "./campaigns";

export interface JourneyEntry {
  date: string; // yyyy-mm-dd
  campaign: string;
  quest: string;
  questType: "sub" | "side";
  note: string;
}

export interface BlogRef {
  id: string;
  title: string;
  quest?: string;
}

export interface JourneyDay {
  date: string;
  worked: boolean;
  entry?: JourneyEntry;
  blog?: BlogRef;
}

export interface JourneyMonth {
  key: string; // yyyy-mm
  label: string;
  weeks: (JourneyDay | null)[][];
}

export const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Builds one JourneyDay per calendar day from `start` to `end` (inclusive),
 * absence of a matching entry meaning "unworked" — per the PRD's decision
 * not to persist explicit `worked: false` records.
 */
export function buildDays(entries: JourneyEntry[], blogs: BlogRef[], start: Date, end: Date): JourneyDay[] {
  const byDate = new Map(entries.map((e) => [e.date, e]));
  const blogByQuest = new Map(blogs.filter((b) => b.quest).map((b) => [b.quest as string, b]));

  const out: JourneyDay[] = [];
  for (const d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const date = toDateStr(d);
    const entry = byDate.get(date);
    out.push({
      date,
      worked: Boolean(entry),
      entry,
      blog: entry ? blogByQuest.get(entry.quest) : undefined,
    });
  }
  return out;
}

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

export function dominantCampaign(month: JourneyMonth): string | undefined {
  const counts: Record<string, number> = {};
  month.weeks.flat().forEach((d) => {
    if (d?.entry) counts[d.entry.campaign] = (counts[d.entry.campaign] ?? 0) + 1;
  });
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return top?.[0];
}

export function monthHasLogs(month: JourneyMonth): boolean {
  return month.weeks.flat().some((d) => d?.worked);
}

/**
 * A streak breaks on any unworked day. `days` is expected to run through
 * today. If today itself has no entry yet, it's dropped before counting —
 * an unstarted "today" must not read as breaking an otherwise-live streak.
 */
export function currentStreak(days: JourneyDay[], todayDate: string): number {
  let list = days;
  const last = list[list.length - 1];
  if (last && last.date === todayDate && !last.worked) {
    list = list.slice(0, -1);
  }

  let streak = 0;
  for (let i = list.length - 1; i >= 0; i--) {
    if (!list[i].worked) break;
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

export function totalDays(days: JourneyDay[]): number {
  return days.filter((d) => d.worked).length;
}

export { campaignColor, campaignLabel };
