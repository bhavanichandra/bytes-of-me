import { describe, expect, test } from "bun:test";
import { buildDays, currentStreak, bestStreak } from "./journey";

const entry = (date: string, quest = "Sub Quest 1") => ({
  date,
  campaign: "example-campaign",
  quest,
  questType: "sub" as const,
  note: "",
});

describe("buildDays", () => {
  test("absence of an entry means unworked", () => {
    const days = buildDays([entry("2026-07-02")], [], new Date(2026, 6, 1), new Date(2026, 6, 3));
    expect(days.map((d) => d.worked)).toEqual([false, true, false]);
  });

  test("auto-links a day to a blog post by matching quest", () => {
    const days = buildDays(
      [entry("2026-07-02", "Sub Quest 1")],
      [{ id: "post-1", title: "Post One", quest: "Sub Quest 1" }],
      new Date(2026, 6, 2),
      new Date(2026, 6, 2)
    );
    expect(days[0].blog?.id).toBe("post-1");
  });
});

describe("currentStreak", () => {
  test("breaks on any unworked day", () => {
    const days = buildDays(
      [entry("2026-07-01"), entry("2026-07-02")],
      [],
      new Date(2026, 6, 1),
      new Date(2026, 6, 4)
    );
    expect(currentStreak(days, "2026-07-04")).toBe(0);
  });

  test("counts the trailing run of worked days", () => {
    const days = buildDays(
      [entry("2026-07-02"), entry("2026-07-03"), entry("2026-07-04")],
      [],
      new Date(2026, 6, 1),
      new Date(2026, 6, 4)
    );
    expect(currentStreak(days, "2026-07-04")).toBe(3);
  });

  test("an unlogged today doesn't break an in-progress streak", () => {
    const days = buildDays(
      [entry("2026-07-02"), entry("2026-07-03")],
      [],
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
      [],
      new Date(2026, 6, 1),
      new Date(2026, 6, 5)
    );
    expect(bestStreak(days)).toBe(3);
  });
});
