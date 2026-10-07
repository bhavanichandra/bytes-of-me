export interface JournalEntry {
  date: string; // yyyy-mm-dd
  title?: string;
  note: string;
}

export interface JournalDay {
  date: string;
  worked: boolean;
  entry?: JournalEntry;
}

export interface JournalMonth {
  key: string; // yyyy-mm
  label: string;
  weeks: (JournalDay | null)[][];
}

export const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Local calendar date as yyyy-mm-dd. */
export function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Absence of an entry for a date means unworked — no explicit `worked: false` records. */
export function buildDays(entries: JournalEntry[], start: Date, end: Date): JournalDay[] {
  const byDate = new Map(entries.map((e) => [e.date, e]));

  const out: JournalDay[] = [];
  for (const d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const date = toDateStr(d);
    const entry = byDate.get(date);
    out.push({ date, worked: Boolean(entry), entry });
  }
  return out;
}

export function groupByMonth(days: JournalDay[]): JournalMonth[] {
  const byKey = new Map<string, JournalDay[]>();
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

    const cells: (JournalDay | null)[] = [];
    const firstWeekday = (new Date(year, month - 1, 1).getDay() + 6) % 7; // Mon=0
    for (let i = 0; i < firstWeekday; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${key}-${String(d).padStart(2, "0")}`;
      cells.push(byDate.get(dateStr) ?? null);
    }
    while (cells.length % 7 !== 0) cells.push(null);

    const weeks: (JournalDay | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

    return { key, label, weeks };
  });
}

export function monthHasLogs(month: JournalMonth): boolean {
  return month.weeks.flat().some((d) => d?.worked);
}

/** An unlogged "today" is dropped before counting — it must not read as breaking a live streak. */
export function currentStreak(days: JournalDay[], todayDate: string): number {
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

export function bestStreak(days: JournalDay[]): number {
  let best = 0;
  let run = 0;
  for (const d of days) {
    run = d.worked ? run + 1 : 0;
    best = Math.max(best, run);
  }
  return best;
}

export function totalDays(days: JournalDay[]): number {
  return days.filter((d) => d.worked).length;
}
