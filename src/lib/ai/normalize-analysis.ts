import type { DreamAnalysis, DreamEventAnalysis, DreamPersonAnalysis } from "@/types/dream";
import { dreamAnalysisSchema } from "@/types/validation";

function asString(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value
      .map((item) => asString(item))
      .filter(Boolean)
      .join(", ");
  }
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    if (typeof obj.text === "string") return obj.text.trim();
    if (typeof obj.description === "string") return obj.description.trim();
    if (typeof obj.title === "string") return obj.title.trim();
  }
  return fallback;
}

function asStringArray(value: unknown): string[] {
  if (!value) return [];
  if (typeof value === "string") {
    return value
      .split(/[,;|]/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (!Array.isArray(value)) return [];
  return value.map((item) => asString(item)).filter(Boolean);
}

function asPerson(value: unknown, index: number): DreamPersonAnalysis {
  if (typeof value === "string") {
    return {
      name: value.trim() || `Person ${index + 1}`,
      isRealPerson: false,
    };
  }
  const obj = (value && typeof value === "object"
    ? value
    : {}) as Record<string, unknown>;
  return {
    name: asString(obj.name ?? obj.person ?? obj.title, `Person ${index + 1}`),
    description: asString(obj.description) || undefined,
    isRealPerson: Boolean(obj.isRealPerson ?? obj.real ?? false),
    relationship: asString(obj.relationship) || undefined,
  };
}

function asEvent(value: unknown, index: number): DreamEventAnalysis {
  if (typeof value === "string") {
    const text = value.trim();
    return {
      order: index + 1,
      title: text.split(/[.!?]/)[0]?.slice(0, 48) || `Moment ${index + 1}`,
      description: text || `Moment ${index + 1}`,
      importance: Math.max(5, 10 - index),
    };
  }
  const obj = (value && typeof value === "object"
    ? value
    : {}) as Record<string, unknown>;
  const description = asString(
    obj.description ?? obj.summary ?? obj.text ?? obj.event,
    `Moment ${index + 1}`,
  );
  const title = asString(
    obj.title ?? obj.name,
    description.split(/[.!?]/)[0]?.slice(0, 48) || `Moment ${index + 1}`,
  );
  const order =
    typeof obj.order === "number" && Number.isFinite(obj.order)
      ? Math.max(1, Math.round(obj.order))
      : index + 1;
  const importance =
    typeof obj.importance === "number" && Number.isFinite(obj.importance)
      ? Math.min(10, Math.max(0, obj.importance))
      : Math.max(5, 10 - index);

  return { order, title, description, importance };
}

/**
 * Coerce common LLM JSON shape drift into DreamAnalysis before Zod parse.
 */
export function normalizeDreamAnalysis(input: unknown): DreamAnalysis {
  const raw =
    input && typeof input === "object"
      ? (input as Record<string, unknown>)
      : {};

  // Some models wrap payload
  const nested =
    raw.analysis && typeof raw.analysis === "object"
      ? (raw.analysis as Record<string, unknown>)
      : raw.dream && typeof raw.dream === "object"
        ? (raw.dream as Record<string, unknown>)
        : raw;

  const peopleSource = nested.people ?? nested.characters ?? [];
  const eventsSource =
    nested.majorEvents ?? nested.events ?? nested.keyMoments ?? [];

  const title = asString(nested.title, "Untitled Dream");
  const summary = asString(
    nested.summary ?? nested.description,
    title,
  );
  const mood = asString(nested.mood ?? nested.tone ?? nested.atmosphere, "Quiet");
  const emotions = asStringArray(nested.emotions ?? nested.feelings);
  const locations = asStringArray(
    nested.locations ?? nested.places ?? nested.setting,
  );
  const importantObjects = asStringArray(
    nested.importantObjects ?? nested.objects ?? nested.symbols,
  );
  const people = Array.isArray(peopleSource)
    ? peopleSource.map((p, i) => asPerson(p, i))
    : [];
  const majorEvents = Array.isArray(eventsSource)
    ? eventsSource.map((e, i) => asEvent(e, i))
    : [];

  const visualDescription = asString(
    nested.visualDescription ?? nested.visuals ?? nested.scene,
    summary,
  );
  const imagePrompt = asString(
    nested.imagePrompt ?? nested.prompt ?? nested.image_prompt,
    `Cinematic dream memory: ${visualDescription}. Soft atmospheric lighting, coherent single frame, no text.`,
  );

  const candidate = {
    title: title || "Untitled Dream",
    summary: summary || title || "A remembered dream.",
    mood: mood || "Quiet",
    emotions: emotions.length > 0 ? emotions : [mood || "reflective"],
    people,
    locations,
    importantObjects,
    majorEvents:
      majorEvents.length > 0
        ? majorEvents
        : [
            {
              order: 1,
              title: title || "The Dream",
              description: summary || title || "A remembered dream.",
              importance: 8,
            },
          ],
    visualDescription: visualDescription || summary || title,
    imagePrompt:
      imagePrompt ||
      `Cinematic dream memory of ${title}. Soft atmospheric lighting, no text.`,
  };

  return dreamAnalysisSchema.parse(candidate);
}
