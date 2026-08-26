import OpenAI, { toFile } from "openai";
import { getStorageProvider } from "@/lib/storage";
import { readStoredMedia } from "@/lib/storage/read-media";
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
 * With reference photos, uses images.edit so likeness can carry into the dream frame.
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

    const prompt = [
      input.prompt.trim(),
      `Visual style: ${styleHint}.`,
      "Single coherent dream memory frame.",
      "No text, no watermark, no UI, no logo.",
      input.referenceImages && input.referenceImages.length > 0
        ? "Preserve the likeness of people from the reference photo(s) while placing them naturally in the dream scene."
        : "",
    ]
      .filter(Boolean)
      .join(" ");

    const refFiles = await this.loadReferenceFiles(input.referenceImages ?? []);

    let result;
    if (refFiles.length > 0) {
      result = await this.client.images.edit({
        model: "gpt-image-1",
        image: refFiles.length === 1 ? refFiles[0]! : refFiles,
        prompt: prompt.slice(0, 32000),
        size: "1024x1024",
        // Supported by gpt-image-1 for face/logo preservation (SDK types may lag).
        ...( { input_fidelity: "high" } as Record<string, string> ),
      });
    } else {
      result = await this.client.images.generate({
        model: "gpt-image-1",
        prompt: prompt.slice(0, 4000),
        size: "1024x1024",
        n: 1,
      });
    }

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

  private async loadReferenceFiles(urls: string[]) {
    const files = [];
    for (const url of urls.slice(0, 4)) {
      const stored = await readStoredMedia(url);
      if (!stored) continue;
      files.push(
        await toFile(stored.data, stored.filename, { type: stored.mimeType }),
      );
    }
    return files;
  }
}
