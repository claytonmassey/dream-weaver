import type { DreamVisualStyle, GeneratedDreamImage } from "@/types/dream";
import type { DreamImageProvider } from "@/lib/ai/providers/types";

/**
 * Demo image provider — returns curated placeholder imagery.
 * Replace with a real provider in providers/index.ts when AI_IMAGE_API_KEY is set.
 */
export class MockDreamImageProvider implements DreamImageProvider {
  async generateDreamImage(input: {
    prompt: string;
    referenceImages?: string[];
    style?: DreamVisualStyle;
  }): Promise<GeneratedDreamImage> {
    await new Promise((r) => setTimeout(r, 1400));

    const style = input.style ?? "cinematic";
    const prompt = input.prompt.toLowerCase();

    // Deterministic placeholder selection based on prompt keywords
    const url = pickPlaceholder(prompt);

    return {
      url,
      width: 1280,
      height: 720,
      provider: "mock",
      style,
    };
  }
}

function pickPlaceholder(prompt: string): string {
  if (
    prompt.includes("neighborhood") ||
    prompt.includes("floating") ||
    (prompt.includes("house") && prompt.includes("moon"))
  ) {
    return "/placeholders/floating-neighborhood.svg";
  }
  if (prompt.includes("hotel") || prompt.includes("hallway")) {
    return "/placeholders/endless-hotel.svg";
  }
  if (prompt.includes("flood") || prompt.includes("city") || prompt.includes("drive")) {
    return "/placeholders/flooded-city.svg";
  }
  if (prompt.includes("train") || prompt.includes("station")) {
    return "/placeholders/train-station.svg";
  }
  if (prompt.includes("two moon") || prompt.includes("two moons") || prompt.includes("beach")) {
    return "/placeholders/two-moons.svg";
  }
  if (prompt.includes("moon")) {
    return "/placeholders/orange-moon.svg";
  }
  return "/placeholders/orange-moon.svg";
}
