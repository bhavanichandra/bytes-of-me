export interface CareerEntry {
  company: string;
  title: string;
  start: string; // yyyy-mm-dd
  end: string | null; // null = present / active
  blurb: string;
  tags: string[];
  color: string;
  promotion?: { title: string; note: string };
}

export const CAREER: CareerEntry[] = [
  {
    company: "GE Vernova",
    title: "Senior Software Engineer",
    start: "2023-07-07",
    end: null,
    blurb:
      "Currently on the main quest — shipping and hardening production systems, full stack, no respawns.",
    tags: ["Java", "Angular", "AWS", "AI", "Kubernetes", "Docker"],
    color: "#ef4444", // red-500, matches MeCards' GE Vernova accent
  },
  {
    company: "Docskiff (later Jaggaer)",
    title: "Senior Software Engineer — Full-stack",
    start: "2021-11-29",
    end: "2023-07-07",
    blurb:
      "Built an AI-powered contract-analytics product end to end — Angular front end, Django API, AWS deploys. Pre-ChatGPT era; the \"AI\" was mostly rules and elbow grease.",
    tags: ["Angular", "Python", "Django", "AWS"],
    color: "#38bdf8", // sky-400, matches MeCards' hackathon accent
  },
  {
    company: "Standav",
    title: "Software Engineer",
    start: "2018-06-18",
    end: "2021-11-27",
    blurb:
      "Started as a fresher grinding through integration quests — MuleSoft, Workato, Spring Boot with Spring Integration. Learned the API fundamentals the hard way.",
    tags: ["MuleSoft", "Workato", "Spring Boot", "Spring Integration"],
    color: "#fbbf24", // amber-400
    promotion: {
      title: "Senior Software Engineer",
      note: "Leveled up mid-run after clearing enough integration projects.",
    },
  },
];

export function formatDuration(start: string, end: string | null): string {
  const s = new Date(start);
  const e = end ? new Date(end) : new Date();
  let months = (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth());
  if (e.getDate() < s.getDate()) months -= 1;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  const parts = [];
  if (years) parts.push(`${years}y`);
  if (rem || !years) parts.push(`${rem}m`);
  return parts.join(" ");
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

// Beard level is derived from years-of-experience-at-role-start, not hardcoded
// per entry, so adding future roles doesn't require renumbering existing ones.
// Thresholds are years since the first-ever role's start date; crossing a
// threshold bumps the beard stage. Max stage = BEARD_THRESHOLDS.length.
const BEARD_THRESHOLDS = [1.5, 4.5];
export const BEARD_MAX_LEVEL = BEARD_THRESHOLDS.length;

const FIRST_START = CAREER.reduce(
  (earliest, e) => (e.start < earliest ? e.start : earliest),
  CAREER[0].start
);

export function beardLevelFor(entry: CareerEntry): number {
  const years =
    (new Date(entry.start).getTime() - new Date(FIRST_START).getTime()) /
    (1000 * 60 * 60 * 24 * 365.25);
  return BEARD_THRESHOLDS.filter((t) => years >= t).length;
}
