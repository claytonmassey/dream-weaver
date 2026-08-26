import type { DreamAnalysis } from "@/types/dream";
import type {
  ConversationMessage,
  ConversationTurnResult,
} from "@/types/conversation";
import type {
  DreamAnalysisProvider,
  TranscriptionProvider,
} from "@/lib/ai/providers/types";

const DEMO_TRANSCRIPT = `I was walking through my childhood neighborhood late at night. My ex was walking beside me, although we hadn't spoken in years. We reached my old house and suddenly every house on the street slowly lifted into the air. There was a giant orange moon behind them and I remember feeling strangely calm.`;

const FLOATING_NEIGHBORHOOD_ANALYSIS: DreamAnalysis = {
  title: "The Floating Neighborhood",
  summary:
    "You walked through your childhood neighborhood at night with your ex beside you. At your old house, the homes along the street rose into the air beneath a giant orange moon while you felt strangely calm.",
  mood: "Nostalgic calm",
  emotions: ["nostalgic", "calm", "wistful"],
  people: [
    {
      name: "My ex",
      description: "Walking quietly beside you after years without speaking",
      isRealPerson: true,
      relationship: "ex",
    },
  ],
  locations: ["childhood neighborhood", "old house", "night street"],
  importantObjects: ["floating houses", "giant orange moon"],
  majorEvents: [
    {
      order: 1,
      title: "The Neighborhood",
      description:
        "You walked through your childhood neighborhood late at night.",
      importance: 8,
    },
    {
      order: 2,
      title: "Your Ex Appears",
      description:
        "Your ex walked beside you, though you hadn't spoken in years.",
      importance: 9,
    },
    {
      order: 3,
      title: "The Houses Rise",
      description:
        "Every house on the street slowly lifted into the air.",
      importance: 10,
    },
    {
      order: 4,
      title: "The Orange Moon",
      description:
        "A giant orange moon glowed behind the floating houses.",
      importance: 9,
    },
  ],
  visualDescription:
    "A quiet childhood street at night, houses gently lifting into a deep sky, a massive orange moon behind them, two figures walking below in soft moonlight.",
  imagePrompt:
    "Cinematic night scene of a childhood suburban street, quiet asphalt and porch lights, houses slowly floating upward into a dark blue sky, enormous glowing orange full moon behind the rising homes, two small figures walking side by side on the sidewalk below, nostalgic calm atmosphere, soft volumetric moonlight, photorealistic dream memory, shallow depth of field, no text",
};

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function detectRealPeople(transcript: string): DreamAnalysis["people"] {
  const lower = transcript.toLowerCase();
  const people: DreamAnalysis["people"] = [];

  const patterns: Array<{
    match: RegExp;
    name: string;
    relationship: string;
  }> = [
    { match: /\bmy ex\b/, name: "My ex", relationship: "ex" },
    { match: /\bmy wife\b/, name: "My wife", relationship: "wife" },
    { match: /\bmy husband\b/, name: "My husband", relationship: "husband" },
    {
      match: /\bmy (boyfriend|girlfriend)\b/,
      name: "My partner",
      relationship: "partner",
    },
    { match: /\bmy mom\b|\bmy mother\b/, name: "My mom", relationship: "mother" },
    { match: /\bmy dad\b|\bmy father\b/, name: "My dad", relationship: "father" },
    { match: /\bmy boss\b/, name: "My boss", relationship: "boss" },
    {
      match: /\bmy friend ([A-Z][a-z]+)\b/,
      name: "Friend",
      relationship: "friend",
    },
  ];

  for (const pattern of patterns) {
    const found = transcript.match(pattern.match) ?? lower.match(pattern.match);
    if (found) {
      const named = found[1];
      people.push({
        name: named ? `My friend ${named}` : pattern.name,
        isRealPerson: true,
        relationship: pattern.relationship,
        description: `Mentioned as someone from your life`,
      });
    }
  }

  const namedFriend = transcript.match(/\b(?:friend|my friend)\s+([A-Z][a-z]+)\b/);
  if (namedFriend && !people.some((p) => p.name.includes(namedFriend[1]))) {
    people.push({
      name: namedFriend[1],
      isRealPerson: true,
      relationship: "friend",
      description: `Your friend ${namedFriend[1]}`,
    });
  }

  return people;
}

function buildMockAnalysis(transcript: string): DreamAnalysis {
  const normalized = transcript.toLowerCase();

  if (
    normalized.includes("childhood neighborhood") ||
    normalized.includes("floating") ||
    normalized.includes("orange moon")
  ) {
    return FLOATING_NEIGHBORHOOD_ANALYSIS;
  }

  const people = detectRealPeople(transcript);
  const hash = hashString(transcript);
  const moods = ["Quiet wonder", "Uneasy curiosity", "Soft melancholy", "Calm awe"];
  const mood = moods[hash % moods.length];

  const sentences = transcript
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const events = sentences.slice(0, 4).map((sentence, index) => ({
    order: index + 1,
    title: sentence.split(" ").slice(0, 4).join(" ") || `Moment ${index + 1}`,
    description: sentence.endsWith(".") ? sentence : `${sentence}.`,
    importance: Math.max(5, 10 - index),
  }));

  if (events.length === 0) {
    events.push({
      order: 1,
      title: "The Dream",
      description: transcript.slice(0, 180),
      importance: 8,
    });
  }

  const titleWords = transcript.split(" ").slice(0, 5).join(" ");

  return {
    title: titleWords.length > 3 ? titleWords : "Untitled Dream",
    summary: sentences.slice(0, 2).join(". ") + (sentences.length ? "." : ""),
    mood,
    emotions: [mood.toLowerCase().split(" ")[0], "reflective"],
    people,
    locations: normalized.includes("hotel")
      ? ["endless hotel hallway"]
      : normalized.includes("beach")
        ? ["shoreline", "night beach"]
        : normalized.includes("city")
          ? ["flooded city streets"]
          : ["dreamscape"],
    importantObjects: normalized.includes("moon")
      ? ["moon"]
      : normalized.includes("train")
        ? ["train station"]
        : ["memory fragments"],
    majorEvents: events,
    visualDescription: `A cinematic memory of: ${sentences.slice(0, 3).join("; ")}`,
    imagePrompt: `Cinematic dream memory, ${mood.toLowerCase()}, key scene from: ${transcript.slice(0, 220)}, soft atmospheric lighting, coherent single frame, photorealistic with gentle dreamlike quality, no text, no watermark`,
  };
}

export class MockTranscriptionProvider implements TranscriptionProvider {
  async transcribe(_audio: File | Blob): Promise<string> {
    await delay(900);
    return DEMO_TRANSCRIPT;
  }
}

export class MockDreamAnalysisProvider implements DreamAnalysisProvider {
  async cleanupTranscript(rawTranscript: string): Promise<string> {
    await delay(400);
    // Grammar-only mock cleanup: fillers, spacing, capitalize first letter.
    let text = rawTranscript
      .replace(/\b(um|uh|erm|like|you know)\b[, ]*/gi, "")
      .replace(/\s+/g, " ")
      .replace(/\s+([,.!?])/g, "$1")
      .trim();
    if (text.length > 0) {
      text = text.charAt(0).toUpperCase() + text.slice(1);
    }
    if (text && !/[.!?]$/.test(text)) {
      text = `${text}.`;
    }
    return text;
  }

  async analyze(transcript: string): Promise<DreamAnalysis> {
    await delay(1200);
    return buildMockAnalysis(transcript);
  }

  async converse(input: {
    transcript: string;
    history: ConversationMessage[];
  }): Promise<ConversationTurnResult> {
    await delay(700);
    const userTurns = input.history.filter((m) => m.role === "user").length;

    if (userTurns === 0) {
      return {
        message:
          "I can almost see it. Was the light more blue and cold, or warm like that orange moon?",
        readyForDesign: false,
        enrichedTranscript: input.transcript,
      };
    }

    if (userTurns === 1) {
      const answer = input.history[input.history.length - 1]?.content ?? "";
      return {
        message:
          "Got it. Was anyone else nearby, or did it feel like just the two of you on that street?",
        readyForDesign: false,
        enrichedTranscript: `${input.transcript}\n\nAlso: ${answer}`.trim(),
      };
    }

    const extras = input.history
      .filter((m) => m.role === "user")
      .map((m) => m.content)
      .join(" ");

    return {
      message:
        "That gives me enough to start painting. Choose a style and I'll begin.",
      readyForDesign: true,
      enrichedTranscript: `${input.transcript}\n\nMore detail: ${extras}`.trim(),
    };
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export { DEMO_TRANSCRIPT, FLOATING_NEIGHBORHOOD_ANALYSIS };
