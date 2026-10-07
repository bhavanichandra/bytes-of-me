import { describe, expect, test } from "bun:test";
import { buildDays, currentStreak, bestStreak, groupByMonth, monthHasLogs } from "./journal";

const entry = (date: string, title?: string) => ({ date, title, note: "" });

describe("buildDays", () => {
  test("absence of an entry means unworked", () => {
    const days = buildDays([entry("2026-07-02")], new Date(2026, 6, 1), new Date(2026, 6, 3));
    expect(days.map((d) => d.worked)).toEqual([false, true, false]);
  });

  test("attaches the entry to its day", () => {
    const days = buildDays([entry("2026-07-02", "Rate limiting")], new Date(2026, 6, 2), new Date(2026, 6, 2));
    expect(days[0].entry?.title).toBe("Rate limiting");
  });
});

describe("currentStreak", () => {
  test("breaks on any unworked day", () => {
    const days = buildDays(
      [entry("2026-07-01"), entry("2026-07-02")],
      new Date(2026, 6, 1),
      new Date(2026, 6, 4)
    );
    expect(currentStreak(days, "2026-07-04")).toBe(0);
  });

  test("counts the trailing run of worked days", () => {
    const days = buildDays(
      [entry("2026-07-02"), entry("2026-07-03"), entry("2026-07-04")],
      new Date(2026, 6, 1),
      new Date(2026, 6, 4)
    );
    expect(currentStreak(days, "2026-07-04")).toBe(3);
  });

  test("an unlogged today doesn't break an in-progress streak", () => {
    const days = buildDays(
      [entry("2026-07-02"), entry("2026-07-03")],
      new Date(2026, 6, 1),
      new Date(2026, 6, 4)
    );
    expect(currentStreak(days, "2026-07-04")).toBe(2);
  });
});

describe("bestStreak", () => {
  test("finds the longest run across gaps", () => {
    const days = buildDays(
      [entry("2026-07-01"), entry("2026-07-03"), entry("2026-07-04"), entry("2026-07-05")],
      new Date(2026, 6, 1),
      new Date(2026, 6, 5)
    );
    expect(bestStreak(days)).toBe(3);
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
