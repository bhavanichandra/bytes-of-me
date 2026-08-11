// Hand-maintained, not fetched from stackcraft/curriculum/ at build time.
// themuler-cms keeps its own copy for authoring; update both when campaigns
// change.
export interface Campaign {
  slug: string;
  label: string;
  color: string;
}

export const campaigns: Campaign[] = [
  { slug: "example-campaign", label: "Example Campaign", color: "#f472b6" },
  { slug: "daily-learnings", label: "Daily Learnings", color: "#22d3ee" },
];

export function campaignLabel(slug: string): string {
  return campaigns.find((c) => c.slug === slug)?.label ?? slug;
}

export function campaignColor(slug: string): string {
  return campaigns.find((c) => c.slug === slug)?.color ?? "rgba(255,255,255,0.35)";
}
