import { analyzeDream, cleanupDreamTranscript } from "@/lib/ai/dream-analysis";
import { generateDreamImage } from "@/lib/ai/image-generation";
import { transcribeAudio } from "@/lib/ai/transcription";
import { dreamRepository } from "@/lib/db/dream-repository";
import type { Dream, DreamVisualStyle } from "@/types/dream";
import type { CreateDreamRequest } from "@/types/validation";

export async function serviceTranscribe(audio: File | Blob): Promise<{
  transcript: string;
  cleanedTranscript: string;
}> {
  const transcript = await transcribeAudio(audio);
  const cleanedTranscript = await cleanupDreamTranscript(transcript);
  return { transcript, cleanedTranscript };
}

export async function serviceAnalyze(transcript: string) {
  const cleanedTranscript = await cleanupDreamTranscript(transcript);
  const analysis = await analyzeDream(cleanedTranscript);
  return { cleanedTranscript, analysis };
}

export async function serviceCreateDream(
  userId: string,
  input: CreateDreamRequest,
): Promise<Dream> {
  const dream = await dreamRepository.create({
    userId,
    dreamDate: new Date(input.dreamDate).toISOString(),
    rawTranscript: input.rawTranscript,
    cleanedTranscript: input.cleanedTranscript,
    analysis: input.analysis,
    retainAudio: input.retainAudio,
    audioUrl: input.audioUrl,
    visualStyle: input.visualStyle,
  });

  // Apply reference photos if provided before image generation
  if (input.referencePhotos?.length) {
    for (const ref of input.referencePhotos) {
      const person = dream.people.find(
        (p) => p.name.toLowerCase() === ref.personName.toLowerCase(),
      );
      if (person) {
        await dreamRepository.setPersonReference(
          userId,
          dream.id,
          person.id,
          ref.imageUrl,
        );
      }
    }
  }

  return (await dreamRepository.get(userId, dream.id)) ?? dream;
}

/**
 * Save dream first, then attempt image generation.
 * Image failure must not lose the dream.
 */
export async function serviceGenerateDreamImage(
  userId: string,
  dreamId: string,
  style?: DreamVisualStyle,
  referenceImageUrls?: string[],
): Promise<Dream> {
  const dream = await dreamRepository.get(userId, dreamId);
  if (!dream) {
    throw new Error("Dream not found");
  }

  const refs =
    referenceImageUrls && referenceImageUrls.length > 0
      ? referenceImageUrls
      : dream.people
          .map((p) => p.referenceImageUrl)
          .filter((url): url is string => Boolean(url));

  try {
    const image = await generateDreamImage({
      prompt: dream.analysisJson.imagePrompt,
      style: style ?? dream.visualStyle,
      referenceImages: refs,
    });
    const updated = await dreamRepository.updateImage(
      userId,
      dreamId,
      image.url,
      "ready",
    );
    if (!updated) throw new Error("Failed to save image");
    return updated;
  } catch (error) {
    await dreamRepository.updateImage(userId, dreamId, "", "failed");
    throw error;
  }
}

export async function serviceListDreams(userId: string) {
  return dreamRepository.list(userId);
}

export async function serviceGetDream(userId: string, dreamId: string) {
  return dreamRepository.get(userId, dreamId);
}

export async function serviceDeleteDream(userId: string, dreamId: string) {
  return dreamRepository.delete(userId, dreamId);
}
