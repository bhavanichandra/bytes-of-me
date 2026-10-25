import { describe, expect, test } from "bun:test";
import { buildDays, groupByMonth, monthHasLogs } from "./heatmap";

const entry = (date: string) => ({ date });

describe("buildDays", () => {
  test("absence of an entry means unworked", () => {
    const days = buildDays([entry("2026-07-02")], new Date(2026, 6, 1), new Date(2026, 6, 3));
    expect(days.map((d) => d.worked)).toEqual([false, true, false]);
  });

  test("collects every entry on the same day", () => {
    const days = buildDays(
      [entry("2026-07-02"), entry("2026-07-02")],
      new Date(2026, 6, 2),
      new Date(2026, 6, 2)
    );
    expect(days[0].entries).toHaveLength(2);
  });
});

describe("groupByMonth", () => {
  test("pads weeks to Monday-first rows and flags months with logs", () => {
    const days = buildDays([entry("2026-07-02")], new Date(2026, 5, 1), new Date(2026, 6, 31));
    const [june, july] = groupByMonth(days);
    expect(june.weeks.every((w) => w.length === 7)).toBe(true);
    expect(monthHasLogs(june)).toBe(false);
    expect(monthHasLogs(july)).toBe(true);
  });
});
