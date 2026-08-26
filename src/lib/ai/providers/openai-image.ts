import OpenAI from "openai";
import { getStorageProvider } from "@/lib/storage";
import type { DreamImageProvider } from "@/lib/ai/providers/types";
import type { DreamVisualStyle, GeneratedDreamImage } from "@/types/dream";

const STYLE_HINTS: Record<DreamVisualStyle, string> = {
  cinematic:
    "cinematic film still, dramatic lighting, shallow depth of field, widescreen composition",
  realistic: "photorealistic photography, natural lighting, documentary feel",
  surreal: "surreal dream logic, unexpected juxtapositions, quiet uncanny mood",
  illustrated: "hand-illustrated storybook scene, soft linework, cohesive illustration",
  painting: "painterly oil painting, visible brush texture, gallery lighting",
};

/**
 * OpenAI image generation (gpt-image-1).
 * Saves the resulting PNG into app storage and returns a private media URL.
 */
export class OpenAIImageProvider implements DreamImageProvider {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async generateDreamImage(input: {
    prompt: string;
    referenceImages?: string[];
    style?: DreamVisualStyle;
  }): Promise<GeneratedDreamImage> {
    const style = input.style ?? "cinematic";
    const styleHint = STYLE_HINTS[style];

    // Reference images are reserved for future image-edit / identity flows.
    void input.referenceImages;

    const prompt = [
      input.prompt.trim(),
      `Visual style: ${styleHint}.`,
      "Single coherent dream memory frame.",
      "No text, no watermark, no UI, no logo.",
    ].join(" ");

    const result = await this.client.images.generate({
      model: "gpt-image-1",
      prompt: prompt.slice(0, 4000),
      size: "1024x1024",
      n: 1,
    });

    const item = result.data?.[0];
    if (!item) {
      throw new Error("OpenAI returned no image data");
    }

    let buffer: Buffer;
    if (item.b64_json) {
      buffer = Buffer.from(item.b64_json, "base64");
    } else if (item.url) {
      const downloaded = await fetch(item.url);
      if (!downloaded.ok) {
        throw new Error("Failed to download generated image");
      }
      buffer = Buffer.from(await downloaded.arrayBuffer());
    } else {
      throw new Error("Image response missing b64_json and url");
    }

    const storage = getStorageProvider();
    const saved = await storage.save({
      data: buffer,
      filename: `dream-${style}.png`,
      mimeType: "image/png",
      folder: "images",
    });

    return {
      url: saved.url,
      width: 1024,
      height: 1024,
      provider: "openai-gpt-image-1",
      style,
    };
  }
}
