import { createId } from "@/lib/utils/id";
import type { Dream, DreamAnalysis } from "@/types/dream";
import { FLOATING_NEIGHBORHOOD_ANALYSIS } from "@/lib/ai/providers/mock";

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(7, 30, 0, 0);
  return d.toISOString();
}

function dreamFromAnalysis(
  userId: string,
  analysis: DreamAnalysis,
  transcript: string,
  dreamDate: string,
  imageUrl: string,
  id: string,
): Dream {
  const now = new Date().toISOString();
  return {
    id,
    userId,
    createdAt: dreamDate,
    updatedAt: now,
    dreamDate,
    rawTranscript: transcript,
    cleanedTranscript: transcript,
    title: analysis.title,
    summary: analysis.summary,
    mood: analysis.mood,
    emotions: analysis.emotions,
    locations: analysis.locations,
    objects: analysis.importantObjects,
    analysisJson: analysis,
    imageUrl,
    visualStyle: "cinematic",
    retainAudio: false,
    imageStatus: "ready",
    people: analysis.people.map((p) => ({
      id: createId("person"),
      dreamId: id,
      name: p.name,
      description: p.description ?? null,
      relationship: p.relationship ?? null,
      isRealPerson: p.isRealPerson,
      referenceImageUrl: null,
    })),
    events: analysis.majorEvents.map((e) => ({
      id: createId("event"),
      dreamId: id,
      order: e.order,
      title: e.title,
      description: e.description,
      importance: e.importance,
    })),
    media: [
      {
        id: createId("media"),
        dreamId: id,
        kind: "image",
        url: imageUrl,
        mimeType: "image/svg+xml",
        createdAt: now,
      },
    ],
  };
}

const hotelAnalysis: DreamAnalysis = {
  title: "The Endless Hotel",
  summary:
    "You wandered a hotel hallway that never ended. Doors repeated on both sides under amber sconces while soft carpet muffled every step.",
  mood: "Uneasy curiosity",
  emotions: ["uneasy", "curious", "alone"],
  people: [],
  locations: ["hotel hallway", "endless corridor"],
  importantObjects: ["repeating doors", "amber sconces", "patterned carpet"],
  majorEvents: [
    {
      order: 1,
      title: "Checking the Corridor",
      description: "You stepped into a long hotel hallway lit by warm sconces.",
      importance: 7,
    },
    {
      order: 2,
      title: "The Doors Repeat",
      description: "Every door looked identical, stretching farther than it should.",
      importance: 9,
    },
    {
      order: 3,
      title: "No Exit",
      description: "Turning around only revealed more of the same endless hall.",
      importance: 8,
    },
  ],
  visualDescription:
    "An infinite hotel hallway with repeating doors, warm amber light, deep perspective.",
  imagePrompt:
    "Cinematic endless hotel hallway, repeating identical doors, amber wall sconces, patterned carpet, deep one-point perspective, quiet unease, realistic interior photography, soft grain, no people, no text",
};

const floodedAnalysis: DreamAnalysis = {
  title: "The Flooded City",
  summary:
    "You drove slowly through a familiar city where the streets had turned into still canals reflecting neon and gray sky.",
  mood: "Quiet dread",
  emotions: ["uneasy", "focused", "awestruck"],
  people: [],
  locations: ["flooded city", "downtown streets"],
  importantObjects: ["car", "floodwater", "reflections", "streetlights"],
  majorEvents: [
    {
      order: 1,
      title: "Entering the Water",
      description: "Your tires pushed into water covering the roadway.",
      importance: 8,
    },
    {
      order: 2,
      title: "The Mirror Streets",
      description: "Buildings reflected perfectly in the still floodwater.",
      importance: 9,
    },
    {
      order: 3,
      title: "Driving On",
      description: "You kept driving carefully through the silent flooded city.",
      importance: 7,
    },
  ],
  visualDescription:
    "A car moving through flooded downtown streets with mirrored reflections.",
  imagePrompt:
    "Cinematic flooded city street at dusk, car driving through calm floodwater, neon and streetlight reflections, realistic urban photography, quiet dread, no text",
};

const stationAnalysis: DreamAnalysis = {
  title: "The Train Station Meeting",
  summary:
    "At a quiet evening train station you saw an old friend you had not met in years. They smiled as if no time had passed.",
  mood: "Bittersweet",
  emotions: ["nostalgic", "tender", "surprised"],
  people: [
    {
      name: "An old friend",
      description: "Someone you had not seen in years",
      isRealPerson: true,
      relationship: "friend",
    },
  ],
  locations: ["train station", "evening platform"],
  importantObjects: ["train", "platform lights", "suitcase"],
  majorEvents: [
    {
      order: 1,
      title: "On the Platform",
      description: "You stood on a nearly empty evening platform.",
      importance: 7,
    },
    {
      order: 2,
      title: "A Familiar Face",
      description: "You recognized an old friend across the platform.",
      importance: 10,
    },
    {
      order: 3,
      title: "No Time Passed",
      description: "They smiled as if the years between you had never happened.",
      importance: 9,
    },
  ],
  visualDescription:
    "Evening train platform, soft lights, two people recognizing each other.",
  imagePrompt:
    "Cinematic evening train station platform, soft overhead lights, distant train glow, two figures recognizing each other across the platform, bittersweet nostalgic mood, realistic photography, shallow depth of field, no text",
};

const moonsAnalysis: DreamAnalysis = {
  title: "Two Moons Over the Shore",
  summary:
    "You stood barefoot on a dark beach as two moons rose together over a calm ocean, painting the water silver and pale gold.",
  mood: "Wonder",
  emotions: ["awe", "calm", "small"],
  people: [],
  locations: ["night beach", "ocean shore"],
  importantObjects: ["two moons", "dark sand", "calm ocean"],
  majorEvents: [
    {
      order: 1,
      title: "The Shore",
      description: "You stood barefoot on cool dark sand beside the water.",
      importance: 7,
    },
    {
      order: 2,
      title: "Two Moons Rise",
      description: "Two moons rose together over the calm ocean.",
      importance: 10,
    },
    {
      order: 3,
      title: "Silver Water",
      description: "The sea reflected silver and pale gold light.",
      importance: 8,
    },
  ],
  visualDescription:
    "A night beach with two moons rising over a still ocean.",
  imagePrompt:
    "Cinematic night beach, two large moons rising over a calm ocean, silver and pale gold reflections on water, dark sand, solitary figure small in frame, wonder and calm, realistic with gentle surreal touch, no text",
};

export function buildSeedDreams(userId: string): Dream[] {
  return [
    dreamFromAnalysis(
      userId,
      FLOATING_NEIGHBORHOOD_ANALYSIS,
      "I was walking through my childhood neighborhood late at night. My ex was walking beside me, although we hadn't spoken in years. We reached my old house and suddenly every house on the street slowly lifted into the air. There was a giant orange moon behind them and I remember feeling strangely calm.",
      daysAgo(0),
      "/placeholders/floating-neighborhood.svg",
      "dream_seed_floating",
    ),
    dreamFromAnalysis(
      userId,
      hotelAnalysis,
      "I was walking down a hotel hallway that never seemed to end. Every door looked the same. The lights were warm and the carpet was soft and I couldn't find the lobby no matter how far I walked.",
      daysAgo(4),
      "/placeholders/endless-hotel.svg",
      "dream_seed_hotel",
    ),
    dreamFromAnalysis(
      userId,
      floodedAnalysis,
      "I was driving through the city and the streets were flooded like canals. The water was still and mirrored the buildings. I kept driving slowly, watching the reflections shake whenever the car moved.",
      daysAgo(9),
      "/placeholders/flooded-city.svg",
      "dream_seed_flood",
    ),
    dreamFromAnalysis(
      userId,
      stationAnalysis,
      "I was at a train station in the evening and I saw an old friend I hadn't seen in years standing across the platform. They smiled like no time had passed at all.",
      daysAgo(14),
      "/placeholders/train-station.svg",
      "dream_seed_station",
    ),
    dreamFromAnalysis(
      userId,
      moonsAnalysis,
      "I was standing on a beach at night while two moons rose over the ocean. The water was calm and the light made everything silver and gold. I felt very small and very calm.",
      daysAgo(21),
      "/placeholders/two-moons.svg",
      "dream_seed_moons",
    ),
  ];
}
