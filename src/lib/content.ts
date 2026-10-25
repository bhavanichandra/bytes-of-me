import { getCollection } from "astro:content";
import { BOOK, CLOCK, CODE, COMMENT, FOLDER, SHIELD, SPARK, STAR } from "./pixelIcons";

export interface PostIconMeta {
  bitmap: string[];
  color: string;
}

export const POST_ICON_OPTIONS: PostIconMeta[] = [
  { bitmap: BOOK, color: "#22d3ee" },     // cyan
  { bitmap: FOLDER, color: "#f87171" },   // rose
  { bitmap: SHIELD, color: "#f472b6" },   // pink
  { bitmap: CODE, color: "#a78bfa" },     // purple
  { bitmap: STAR, color: "#fbbf24" },     // amber
  { bitmap: SPARK, color: "#34d399" },    // emerald
  { bitmap: CLOCK, color: "#60a5fa" },    // blue
  { bitmap: COMMENT, color: "#fb923c" },  // orange
];

function hashSlug(slug: string): number {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = (hash << 5) - hash + slug.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getPostIcon(slug: string): PostIconMeta {
  const index = hashSlug(slug) % POST_ICON_OPTIONS.length;
  return POST_ICON_OPTIONS[index];
}

export interface UnifiedPost {
  id: string;
  slug: string;
  href: string;
  title: string;
  description?: string;
  tags?: string[];
  cover?: ImageMetadata;
  date: Date;
  dateLabel: string;
  dateIso: string;
  icon: PostIconMeta;
}

export const postDateFmt = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

export const projectDateFmt = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
});

function toIso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Every post, newest first — the public site's content feed. */
export async function getUnifiedPosts(): Promise<UnifiedPost[]> {
  const posts = await getCollection("posts", ({ data }) => {
    if (import.meta.env.PROD && data.draft) return false;
    return !data.draft;
  });

  return posts
    .map((p) => {
      const slug = p.id.replace(/\/index$/, "");
      return {
        id: p.id,
        slug,
        href: `/posts/${slug}`,
        title: p.data.title,
        description: p.data.description,
        tags: p.data.tags,
        cover: p.data.cover,
        date: p.data.date,
        dateLabel: postDateFmt.format(p.data.date),
        dateIso: toIso(p.data.date),
        icon: getPostIcon(slug),
      };
    })
    .sort((a, b) => b.date.valueOf() - a.date.valueOf());
}
