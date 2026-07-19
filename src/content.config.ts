import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const baseSchema = z.object({
  title: z.string(),
  date: z.coerce.date(),
  description: z.string(),
  tags: z.array(z.string()),
  draft: z.boolean().default(false),
  cover: z.string().optional(),
  // Drives the rarity-frame accent border (ticket #17). "common" (the
  // default) renders no special frame.
  tier: z.enum(["common", "rare", "epic"]).default("common"),
});

const blog = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/blogs" }),
  schema: baseSchema,
});

const projects = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/projects" }),
  schema: baseSchema.extend({
    href: z.string().optional(),
  }),
});

export const collections = { blog, projects };
