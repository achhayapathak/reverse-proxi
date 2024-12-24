import { z } from "zod";

export const workerMessageSchema = z.object({
    requestType: z.enum(['HTTP']),
    headers: z.any(),
    body: z.any(),
    path: z.string()
});

export const workerMessageResponseSchema = z.object({
    data: z.string(),
    headers: z.any().optional(),
    statusCode: z.number()
});

export type workerMessageSchemaType = z.infer<typeof workerMessageSchema>;
export type workerMessageResponseSchemaType = z.infer<typeof workerMessageResponseSchema>;
