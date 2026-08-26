export type IdentifyReferenceResult = {
  isPerson: boolean;
  /** Matched name from the dream conversation, if any */
  personName: string | null;
  relationship: string | null;
  /** Short assistant note shown in chat */
  note: string;
};

/** Client-held reference photo from the conversation */
export type DreamChatReference = {
  id: string;
  file: File;
  previewUrl: string;
  isPerson: boolean;
  personName: string | null;
  relationship: string | null;
  note: string;
};
