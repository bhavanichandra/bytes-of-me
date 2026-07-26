import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

// `image()` resolves the cover filename (co-located with the entry, same
// convention as inline body images) into a real build-processed asset —
// a plain z.string() here would leave `cover` pointing at a filename with
// no actual resolvable URL, since Astro only auto-resolves images
// referenced via markdown syntax in the body, not frontmatter strings.
const baseSchema = ({ image }: { image: () => z.ZodType<ImageMetadata> }) =>
  z.object({
    title: z.string(),
    date: z.coerce.date(),
    description: z.string(),
    tags: z.array(z.string()),
    draft: z.boolean().default(false),
    cover: image().optional(),
    // Drives the rarity-frame accent border. "common" (the default)
    // renders no special frame.
    tier: z.enum(["common", "rare", "epic"]).default("common"),
  });

const blog = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/blogs" }),
  schema: baseSchema,
});

const projects = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/projects" }),
  schema: (context) => baseSchema(context).extend({
    href: z.string().optional(),
  }),
});

export const collections = { blog, projects };
