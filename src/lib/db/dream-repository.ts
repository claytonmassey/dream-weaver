import { localDb } from "@/lib/db/local-store";
import type {
  CreateDreamInput,
  Dream,
  DreamListItem,
  DreamPerson,
} from "@/types/dream";

/**
 * Dream repository — framework-agnostic data access.
 * Uses local JSON store by default (demo). Swap to Prisma when DATABASE_URL is set.
 */
export const dreamRepository = {
  list(userId: string): Promise<DreamListItem[]> {
    return localDb.listDreams(userId);
  },

  get(userId: string, dreamId: string): Promise<Dream | null> {
    return localDb.getDream(userId, dreamId);
  },

  create(input: CreateDreamInput): Promise<Dream> {
    return localDb.createDream(input);
  },

  updateImage(
    userId: string,
    dreamId: string,
    imageUrl: string,
    status: "ready" | "failed",
  ): Promise<Dream | null> {
    return localDb.updateDreamImage(userId, dreamId, imageUrl, status);
  },

  setPersonReference(
    userId: string,
    dreamId: string,
    personId: string,
    imageUrl: string,
  ): Promise<DreamPerson | null> {
    return localDb.setPersonReference(userId, dreamId, personId, imageUrl);
  },

  delete(userId: string, dreamId: string): Promise<boolean> {
    return localDb.deleteDream(userId, dreamId);
  },

  deleteAudio(userId: string, dreamId: string): Promise<boolean> {
    return localDb.deleteAudioMedia(userId, dreamId);
  },

  listPeople(userId: string) {
    return localDb.listPeople(userId);
  },

  listPersonReferences(userId: string) {
    return localDb.listPersonReferences(userId);
  },

  deletePersonReference(userId: string, referenceId: string) {
    return localDb.deletePersonReferencePhoto(userId, referenceId);
  },

  deleteAccount(userId: string) {
    return localDb.deleteAccount(userId);
  },
};
