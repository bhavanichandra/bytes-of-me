import { getCollection } from "astro:content";

export async function getRecentPosts(limit?: number) {
  const posts = (await getCollection("blog", ({ data }) => !data.draft)).sort(
    (a, b) => b.data.date.valueOf() - a.data.date.valueOf()
  );
  return limit ? posts.slice(0, limit) : posts;
}

export async function getSortedProjects() {
  return (await getCollection("projects")).sort(
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
