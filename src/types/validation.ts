import { z } from "zod";

export const dreamVisualStyleSchema = z.enum([
  "cinematic",
  "realistic",
  "surreal",
  "illustrated",
  "painting",
]);

export const dreamPersonAnalysisSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  isRealPerson: z.boolean(),
  relationship: z.string().optional(),
});

export const dreamEventAnalysisSchema = z.object({
  order: z.number().int().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  importance: z.number().min(0).max(10),
});

export const dreamAnalysisSchema = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),
  mood: z.string().min(1),
  emotions: z.array(z.string()),
  people: z.array(dreamPersonAnalysisSchema),
  locations: z.array(z.string()),
  importantObjects: z.array(z.string()),
  majorEvents: z.array(dreamEventAnalysisSchema),
  visualDescription: z.string().min(1),
  imagePrompt: z.string().min(1),
});

export const createDreamRequestSchema = z.object({
  dreamDate: z.string().min(1),
  rawTranscript: z.string().min(1),
  cleanedTranscript: z.string().min(1),
  analysis: dreamAnalysisSchema,
  retainAudio: z.boolean().optional().default(false),
  audioUrl: z.string().nullable().optional(),
  visualStyle: dreamVisualStyleSchema.optional().default("cinematic"),
  referencePhotos: z
    .array(
      z.object({
        personName: z.string(),
        imageUrl: z.string(),
      }),
    )
    .optional()
    .default([]),
});

export const analyzeDreamRequestSchema = z.object({
  transcript: z.string().min(1),
});

export const generateImageRequestSchema = z.object({
  dreamId: z.string().min(1),
  style: dreamVisualStyleSchema.optional().default("cinematic"),
  referenceImageUrls: z.array(z.string()).optional().default([]),
});

export const updateTranscriptRequestSchema = z.object({
  transcript: z.string().min(1),
});

export type CreateDreamRequest = z.infer<typeof createDreamRequestSchema>;
export type AnalyzeDreamRequest = z.infer<typeof analyzeDreamRequestSchema>;
export type GenerateImageRequest = z.infer<typeof generateImageRequestSchema>;
