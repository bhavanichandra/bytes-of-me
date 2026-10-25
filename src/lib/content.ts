import { getCollection } from "astro:content";

export type PostType = "blog" | "project" | "journal";

export interface UnifiedPost {
  type: PostType;
  id: string;
  /** Journal entries have no detail page — they render inline in the feed instead. */
  href?: string;
  title: string;
  description?: string;
  tags?: string[];
  cover?: ImageMetadata;
  date: Date;
  dateLabel: string;
  dateIso: string;
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

/** Every blog post, project and journal entry, newest first — the public site's one content feed. */
export async function getUnifiedPosts(): Promise<UnifiedPost[]> {
  const [posts, projects, journalEntries] = await Promise.all([
    getCollection("blog", ({ data }) => !data.draft),
    getCollection("projects", ({ data }) => !data.draft),
    getCollection("journal"),
  ]);

  const blogPosts: UnifiedPost[] = posts.map((p) => ({
    type: "blog",
    id: p.id,
    href: `/blogs/${p.id}`,
    title: p.data.title,
    description: p.data.description,
    tags: p.data.tags,
    cover: p.data.cover,
    date: p.data.date,
    dateLabel: postDateFmt.format(p.data.date),
    dateIso: toIso(p.data.date),
  }));

  const projectPosts: UnifiedPost[] = projects.map((p) => ({
    type: "project",
    id: p.id,
    href: `/projects/${p.id}`,
    title: p.data.title,
    description: p.data.description,
    tags: p.data.tags,
    cover: p.data.cover,
    date: p.data.date,
    dateLabel: projectDateFmt.format(p.data.date),
    dateIso: toIso(p.data.date),
  }));

  const journalPosts: UnifiedPost[] = journalEntries.map((e) => ({
    type: "journal",
    id: e.id,
    title: e.data.title || e.id,
    description: (e.body ?? "").trim(),
    date: e.data.date,
    dateLabel: postDateFmt.format(e.data.date),
    dateIso: toIso(e.data.date),
  }));

  return [...blogPosts, ...projectPosts, ...journalPosts].sort((a, b) => b.date.valueOf() - a.date.valueOf());
}
