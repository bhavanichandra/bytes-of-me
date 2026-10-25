// Pure date-bucketing for the Calendar view — generic over whatever has a
// `date`, not journal-specific (journal was folded into the unified feed).
export interface HeatmapEntry {
  date: string; // yyyy-mm-dd
}

export interface HeatmapDay<T extends HeatmapEntry> {
  date: string;
  worked: boolean;
  entries: T[];
}

export interface HeatmapMonth<T extends HeatmapEntry> {
  key: string; // yyyy-mm
  label: string;
  weeks: (HeatmapDay<T> | null)[][];
}

export const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Local calendar date as yyyy-mm-dd. */
export function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Absence of an entry for a date means unworked — no explicit `worked: false` records. */
export function buildDays<T extends HeatmapEntry>(entries: T[], start: Date, end: Date): HeatmapDay<T>[] {
  const byDate = new Map<string, T[]>();
  for (const e of entries) {
    if (!byDate.has(e.date)) byDate.set(e.date, []);
    byDate.get(e.date)!.push(e);
  }

  const out: HeatmapDay<T>[] = [];
  for (const d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const date = toDateStr(d);
    const dayEntries = byDate.get(date) ?? [];
    out.push({ date, worked: dayEntries.length > 0, entries: dayEntries });
  }
  return out;
}

export function groupByMonth<T extends HeatmapEntry>(days: HeatmapDay<T>[]): HeatmapMonth<T>[] {
  const byKey = new Map<string, HeatmapDay<T>[]>();
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

    const cells: (HeatmapDay<T> | null)[] = [];
    const firstWeekday = (new Date(year, month - 1, 1).getDay() + 6) % 7; // Mon=0
    for (let i = 0; i < firstWeekday; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${key}-${String(d).padStart(2, "0")}`;
      cells.push(byDate.get(dateStr) ?? null);
    }
    while (cells.length % 7 !== 0) cells.push(null);

    const weeks: (HeatmapDay<T> | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

    return { key, label, weeks };
  });
}

export function monthHasLogs<T extends HeatmapEntry>(month: HeatmapMonth<T>): boolean {
  return month.weeks.flat().some((d) => d?.worked);
}
