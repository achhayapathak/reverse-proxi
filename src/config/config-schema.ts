import { z } from "zod";

const upstreamsSchema = z.object({
  id: z.string(),
  url: z.string(),
});

const headerSchema = z.object({
  key: z.string(),
  value: z.string(),
});

const rulesSchema = z.object({
  path: z.string(),
  upstreams: z.array(z.string()),
});

const rootConfigSchema = z.object({
  server: z.object({
    listen: z.number(),
    workers: z.number().optional(),
    upstreams: z.array(upstreamsSchema),
    headers: z.array(headerSchema).optional(),
    rules: z.array(rulesSchema),
  }),
});

export type ConfigSchemaType = z.infer<typeof rootConfigSchema>;

export default rootConfigSchema;
