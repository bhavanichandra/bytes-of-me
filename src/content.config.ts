import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

// `image()` resolves the cover filename (co-located with the entry, same
// convention as inline body images) into a real build-processed asset.
const posts = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/posts" }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      date: z.coerce.date(),
      tags: z.array(z.string()).default([]),
      draft: z.boolean().default(false),
      enableComments: z.boolean().default(false),
      href: z.string().optional(),
      cover: image().optional(),
    }),
});

export const collections = { posts };
