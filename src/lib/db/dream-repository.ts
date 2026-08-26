import { localDb } from "@/lib/db/local-store";
import { prismaDb } from "@/lib/db/prisma-store";
import { usePrisma } from "@/lib/db/prisma";
import type {
  CreateDreamInput,
  Dream,
  DreamListItem,
  DreamPerson,
} from "@/types/dream";

function db() {
  return usePrisma() ? prismaDb : localDb;
}

/**
 * Dream repository — Prisma/Postgres when DATABASE_URL is set and DEMO_STORE!=true.
 * Falls back to local JSON store for offline demo.
 */
export const dreamRepository = {
  list(userId: string): Promise<DreamListItem[]> {
    return db().listDreams(userId);
  },

  get(userId: string, dreamId: string): Promise<Dream | null> {
    return db().getDream(userId, dreamId);
  },

  create(input: CreateDreamInput): Promise<Dream> {
    return db().createDream(input);
  },

  updateImage(
    userId: string,
    dreamId: string,
    imageUrl: string,
    status: "ready" | "failed",
  ): Promise<Dream | null> {
    return db().updateDreamImage(userId, dreamId, imageUrl, status);
  },

  setPersonReference(
    userId: string,
    dreamId: string,
    personId: string,
    imageUrl: string,
  ): Promise<DreamPerson | null> {
    return db().setPersonReference(userId, dreamId, personId, imageUrl);
  },

  delete(userId: string, dreamId: string): Promise<boolean> {
    return db().deleteDream(userId, dreamId);
  },

  deleteAudio(userId: string, dreamId: string): Promise<boolean> {
    return db().deleteAudioMedia(userId, dreamId);
  },

  listPeople(userId: string) {
    return db().listPeople(userId);
  },

  listPersonReferences(userId: string) {
    return db().listPersonReferences(userId);
  },

  deletePersonReference(userId: string, referenceId: string) {
    return db().deletePersonReferencePhoto(userId, referenceId);
  },

  deleteAccount(userId: string) {
    return db().deleteAccount(userId);
  },

  replaceAllDreams(userId: string, dreams: Dream[]) {
    return db().replaceAllDreams(userId, dreams);
  },
};
