import { getCollection } from "astro:content";
import type { JournalEntry } from "./journal";

export async function getJournalEntries(): Promise<JournalEntry[]> {
  return (await getCollection("journal")).map((e) => ({
    date: e.data.date.toISOString().slice(0, 10),
    title: e.data.title,
    note: e.body ?? "",
  }));
}

export async function getRecentPosts(limit?: number) {
  const posts = (await getCollection("blog", ({ data }) => !data.draft)).sort(
    (a, b) => b.data.date.valueOf() - a.data.date.valueOf()
  );
  return limit ? posts.slice(0, limit) : posts;
}

export async function getSortedProjects() {
  return (await getCollection("projects", ({ data }) => !data.draft)).sort(
    (a, b) => b.data.date.valueOf() - a.data.date.valueOf()
  );
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
