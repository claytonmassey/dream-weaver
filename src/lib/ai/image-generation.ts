import { getDreamImageProvider } from "@/lib/ai/providers";
import type { DreamVisualStyle, GeneratedDreamImage } from "@/types/dream";

export async function generateDreamImage(input: {
  prompt: string;
  referenceImages?: string[];
  style?: DreamVisualStyle;
}): Promise<GeneratedDreamImage> {
  const provider = getDreamImageProvider();
  return provider.generateDreamImage(input);
}
