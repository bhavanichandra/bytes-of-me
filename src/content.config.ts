import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const blog = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/blog" }),
  schema: z.object({
    title: z.string(),
    tags: z.array(z.string()),
    date: z.coerce.date(),
    description: z.string(),
    draft: z.boolean().default(false),
  }),
});

const projects = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/projects" }),
  schema: z.object({
    title: z.string(),
    tag: z.string(),
    date: z.coerce.date(),
    description: z.string(),
    href: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog, projects };
