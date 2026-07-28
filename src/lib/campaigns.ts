// Hand-maintained Campaign slug -> { label, color } lookup, per the Journey
// PRD's explicit decision not to fetch stackcraft/curriculum/ at build time.
// Keep this in sync by hand when campaigns are added/renamed in stackcraft.
// themuler-cms maintains its own copy of this table for authoring; this one
// is bytes-of-me's separate copy for rendering.
export interface Campaign {
  slug: string;
  label: string;
  color: string;
}

export const campaigns: Campaign[] = [
  { slug: "example-campaign", label: "Example Campaign", color: "#f472b6" },
];

export function campaignLabel(slug: string): string {
  return campaigns.find((c) => c.slug === slug)?.label ?? slug;
}

export function campaignColor(slug: string): string {
  return campaigns.find((c) => c.slug === slug)?.color ?? "rgba(255,255,255,0.35)";
}
