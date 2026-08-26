export type DreamVisualStyle =
  | "cinematic"
  | "realistic"
  | "surreal"
  | "illustrated"
  | "painting";

export type DreamPersonAnalysis = {
  name: string;
  description?: string;
  isRealPerson: boolean;
  relationship?: string;
};

export type DreamEventAnalysis = {
  order: number;
  title: string;
  description: string;
  importance: number;
};

export type DreamAnalysis = {
  title: string;
  summary: string;
  mood: string;
  emotions: string[];
  people: DreamPersonAnalysis[];
  locations: string[];
  importantObjects: string[];
  majorEvents: DreamEventAnalysis[];
  visualDescription: string;
  imagePrompt: string;
};

export type PersonReference = {
  personId: string;
  imageUrl: string;
};

export type GeneratedDreamImage = {
  url: string;
  width?: number;
  height?: number;
  provider: string;
  style: DreamVisualStyle;
};

export type DreamMediaKind = "audio" | "image" | "reference_photo";

export type DreamMedia = {
  id: string;
  dreamId: string;
  kind: DreamMediaKind;
  url: string;
  mimeType: string;
  sizeBytes?: number;
  createdAt: string;
};

export type DreamPerson = {
  id: string;
  dreamId: string;
  name: string;
  description?: string | null;
  relationship?: string | null;
  isRealPerson: boolean;
  referenceImageUrl?: string | null;
};

export type DreamEvent = {
  id: string;
  dreamId: string;
  order: number;
  title: string;
  description: string;
  importance: number;
};

export type Dream = {
  id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  dreamDate: string;
  rawTranscript: string;
  cleanedTranscript: string;
  title: string;
  summary: string;
  mood: string;
  emotions: string[];
  locations: string[];
  objects: string[];
  analysisJson: DreamAnalysis;
  imageUrl?: string | null;
  visualStyle: DreamVisualStyle;
  retainAudio: boolean;
  imageStatus: "pending" | "ready" | "failed";
  people: DreamPerson[];
  events: DreamEvent[];
  media: DreamMedia[];
};

export type DreamListItem = Pick<
  Dream,
  | "id"
  | "title"
  | "summary"
  | "mood"
  | "dreamDate"
  | "createdAt"
  | "imageUrl"
  | "imageStatus"
  | "emotions"
> & {
  people: Pick<DreamPerson, "id" | "name" | "isRealPerson">[];
};

export type CreateDreamInput = {
  userId: string;
  dreamDate: string;
  rawTranscript: string;
  cleanedTranscript: string;
  analysis: DreamAnalysis;
  retainAudio?: boolean;
  audioUrl?: string | null;
  visualStyle?: DreamVisualStyle;
};

export type UserAccount = {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
  passwordHash?: string | null;
  createdAt: string;
};
