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
  schema: (context) => baseSchema(context).extend({
    // Matches a journey entry's `quest` value for build-time auto-linking
    // between a Journey day and the blog post covering that work.
    quest: z.string().optional(),
    enableComments: z.boolean().default(false),
  }),
});

const projects = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/projects" }),
  schema: (context) => baseSchema(context).extend({
    href: z.string().optional(),
  }),
});

const journey = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/journey" }),
  schema: z.object({
    date: z.coerce.date(),
    campaign: z.string(),
    quest: z.string(),
    quest_type: z.enum(["sub", "side"]),
  }),
});

export const collections = { blog, projects, journey };
