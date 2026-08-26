import { createId } from "@/lib/utils/id";
import type {
  CreateDreamInput,
  Dream,
  DreamListItem,
  DreamPerson,
  UserAccount,
} from "@/types/dream";
import type { DreamAnalysis } from "@/types/dream";
import fs from "fs/promises";
import path from "path";

type StoreShape = {
  users: UserAccount[];
  dreams: Dream[];
  personReferences: Array<{
    id: string;
    userId: string;
    name: string;
    imageUrl: string;
    createdAt: string;
  }>;
};

const DATA_DIR = path.join(process.cwd(), ".data");
const STORE_PATH = path.join(DATA_DIR, "store.json");

/** Serverless (Vercel) can't persist to the project filesystem. */
const useMemoryStore =
  process.env.VERCEL === "1" || process.env.USE_MEMORY_STORE === "true";

let memoryStore: StoreShape | null = null;

function emptyStore(): StoreShape {
  return { users: [], dreams: [], personReferences: [] };
}

async function ensureStore(): Promise<StoreShape> {
  if (useMemoryStore) {
    if (!memoryStore) memoryStore = emptyStore();
    return memoryStore;
  }

  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    try {
      const raw = await fs.readFile(STORE_PATH, "utf8");
      return JSON.parse(raw) as StoreShape;
    } catch {
      const empty = emptyStore();
      await fs.writeFile(STORE_PATH, JSON.stringify(empty, null, 2));
      return empty;
    }
  } catch {
    // Read-only filesystem or other IO failure — keep serving from memory.
    if (!memoryStore) memoryStore = emptyStore();
    return memoryStore;
  }
}

async function writeStore(store: StoreShape): Promise<void> {
  if (useMemoryStore) {
    memoryStore = store;
    return;
  }

  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(STORE_PATH, JSON.stringify(store, null, 2));
  } catch {
    memoryStore = store;
  }
}

function toListItem(dream: Dream): DreamListItem {
  return {
    id: dream.id,
    title: dream.title,
    summary: dream.summary,
    mood: dream.mood,
    dreamDate: dream.dreamDate,
    createdAt: dream.createdAt,
    imageUrl: dream.imageUrl,
    imageStatus: dream.imageStatus,
    emotions: dream.emotions,
    people: dream.people.map((p) => ({
      id: p.id,
      name: p.name,
      isRealPerson: p.isRealPerson,
    })),
  };
}

export const localDb = {
  async getOrCreateDemoUser(): Promise<UserAccount> {
    const store = await ensureStore();
    let user = store.users.find((u) => u.email === "demo@dreamline.app");
    if (!user) {
      user = {
        id: "user_demo",
        email: "demo@dreamline.app",
        name: "Demo Dreamer",
        createdAt: new Date().toISOString(),
      };
      store.users.push(user);
      await writeStore(store);
    }
    return user;
  },

  async findUserByEmail(email: string): Promise<UserAccount | null> {
    const store = await ensureStore();
    return store.users.find((u) => u.email === email) ?? null;
  },

  async findUserById(id: string): Promise<UserAccount | null> {
    const store = await ensureStore();
    return store.users.find((u) => u.id === id) ?? null;
  },

  async createUser(input: {
    email: string;
    name?: string;
    passwordHash?: string;
    image?: string;
  }): Promise<UserAccount> {
    const store = await ensureStore();
    const email = input.email.toLowerCase().trim();
    const existing = store.users.find((u) => u.email === email);
    if (existing) {
      if (input.passwordHash && !existing.passwordHash) {
        existing.passwordHash = input.passwordHash;
        if (input.name) existing.name = input.name;
        if (input.image) existing.image = input.image;
        await writeStore(store);
      }
      return existing;
    }
    const user: UserAccount = {
      id: createId("user"),
      email,
      name: input.name ?? null,
      passwordHash: input.passwordHash ?? null,
      image: input.image ?? null,
      createdAt: new Date().toISOString(),
    };
    store.users.push(user);
    await writeStore(store);
    return user;
  },

  async updateUserPassword(
    email: string,
    passwordHash: string,
  ): Promise<UserAccount | null> {
    const store = await ensureStore();
    const user = store.users.find(
      (u) => u.email === email.toLowerCase().trim(),
    );
    if (!user) return null;
    user.passwordHash = passwordHash;
    await writeStore(store);
    return user;
  },

  async updateUserProfile(
    userId: string,
    input: { name?: string | null; image?: string | null },
  ): Promise<UserAccount | null> {
    const store = await ensureStore();
    const user = store.users.find((u) => u.id === userId);
    if (!user) return null;
    if (input.name !== undefined) user.name = input.name;
    if (input.image !== undefined) user.image = input.image;
    await writeStore(store);
    return user;
  },

  async listDreams(userId: string): Promise<DreamListItem[]> {
    const store = await ensureStore();
    return store.dreams
      .filter((d) => d.userId === userId)
      .sort(
        (a, b) =>
          new Date(b.dreamDate).getTime() - new Date(a.dreamDate).getTime(),
      )
      .map(toListItem);
  },

  async getDream(userId: string, dreamId: string): Promise<Dream | null> {
    const store = await ensureStore();
    const dream = store.dreams.find((d) => d.id === dreamId && d.userId === userId);
    return dream ?? null;
  },

  async createDream(input: CreateDreamInput): Promise<Dream> {
    const store = await ensureStore();
    const now = new Date().toISOString();
    const analysis = input.analysis;

    const dream: Dream = {
      id: createId("dream"),
      userId: input.userId,
      createdAt: now,
      updatedAt: now,
      dreamDate: input.dreamDate,
      rawTranscript: input.rawTranscript,
      cleanedTranscript: input.cleanedTranscript,
      title: analysis.title,
      summary: analysis.summary,
      mood: analysis.mood,
      emotions: analysis.emotions,
      locations: analysis.locations,
      objects: analysis.importantObjects,
      analysisJson: analysis,
      imageUrl: null,
      visualStyle: input.visualStyle ?? "cinematic",
      retainAudio: input.retainAudio ?? false,
      imageStatus: "pending",
      people: analysis.people.map((p) => ({
        id: createId("person"),
        dreamId: "",
        name: p.name,
        description: p.description ?? null,
        relationship: p.relationship ?? null,
        isRealPerson: p.isRealPerson,
        referenceImageUrl: null,
      })),
      events: analysis.majorEvents.map((e) => ({
        id: createId("event"),
        dreamId: "",
        order: e.order,
        title: e.title,
        description: e.description,
        importance: e.importance,
      })),
      media: [],
    };

    dream.people = dream.people.map((p) => ({ ...p, dreamId: dream.id }));
    dream.events = dream.events.map((e) => ({ ...e, dreamId: dream.id }));

    if (input.audioUrl) {
      dream.media.push({
        id: createId("media"),
        dreamId: dream.id,
        kind: "audio",
        url: input.audioUrl,
        mimeType: "audio/webm",
        createdAt: now,
      });
    }

    store.dreams.unshift(dream);
    await writeStore(store);
    return dream;
  },

  async updateDreamImage(
    userId: string,
    dreamId: string,
    imageUrl: string,
    status: "pending" | "ready" | "failed",
  ): Promise<Dream | null> {
    const store = await ensureStore();
    const dream = store.dreams.find((d) => d.id === dreamId && d.userId === userId);
    if (!dream) return null;
    dream.imageUrl = status === "ready" ? imageUrl : dream.imageUrl;
    dream.imageStatus = status;
    dream.updatedAt = new Date().toISOString();
    if (status === "ready") {
      dream.media.push({
        id: createId("media"),
        dreamId: dream.id,
        kind: "image",
        url: imageUrl,
        mimeType: imageUrl.endsWith(".svg") ? "image/svg+xml" : "image/png",
        createdAt: new Date().toISOString(),
      });
    }
    await writeStore(store);
    return dream;
  },

  async setPersonReference(
    userId: string,
    dreamId: string,
    personId: string,
    imageUrl: string,
  ): Promise<DreamPerson | null> {
    const store = await ensureStore();
    const dream = store.dreams.find((d) => d.id === dreamId && d.userId === userId);
    if (!dream) return null;
    const person = dream.people.find((p) => p.id === personId);
    if (!person) return null;
    person.referenceImageUrl = imageUrl;
    dream.updatedAt = new Date().toISOString();

    const existing = store.personReferences.find(
      (r) => r.userId === userId && r.name === person.name,
    );
    if (existing) {
      existing.imageUrl = imageUrl;
    } else {
      store.personReferences.push({
        id: createId("pref"),
        userId,
        name: person.name,
        imageUrl,
        createdAt: new Date().toISOString(),
      });
    }

    dream.media.push({
      id: createId("media"),
      dreamId: dream.id,
      kind: "reference_photo",
      url: imageUrl,
      mimeType: "image/jpeg",
      createdAt: new Date().toISOString(),
    });

    await writeStore(store);
    return person;
  },

  async deleteDream(userId: string, dreamId: string): Promise<boolean> {
    const store = await ensureStore();
    const before = store.dreams.length;
    store.dreams = store.dreams.filter(
      (d) => !(d.id === dreamId && d.userId === userId),
    );
    await writeStore(store);
    return store.dreams.length < before;
  },

  async deletePersonReferencePhoto(
    userId: string,
    referenceId: string,
  ): Promise<boolean> {
    const store = await ensureStore();
    const ref = store.personReferences.find(
      (r) => r.id === referenceId && r.userId === userId,
    );
    if (!ref) return false;
    store.personReferences = store.personReferences.filter((r) => r.id !== referenceId);
    for (const dream of store.dreams.filter((d) => d.userId === userId)) {
      for (const person of dream.people) {
        if (person.name === ref.name) {
          person.referenceImageUrl = null;
        }
      }
    }
    await writeStore(store);
    return true;
  },

  async listPeople(userId: string) {
    const store = await ensureStore();
    const map = new Map<
      string,
      {
        name: string;
        isRealPerson: boolean;
        appearances: number;
        relationship?: string | null;
        referenceImageUrl?: string | null;
        dreamIds: string[];
      }
    >();

    for (const dream of store.dreams.filter((d) => d.userId === userId)) {
      for (const person of dream.people) {
        const key = person.name.toLowerCase();
        const existing = map.get(key);
        if (existing) {
          existing.appearances += 1;
          existing.dreamIds.push(dream.id);
          if (person.referenceImageUrl) {
            existing.referenceImageUrl = person.referenceImageUrl;
          }
        } else {
          map.set(key, {
            name: person.name,
            isRealPerson: person.isRealPerson,
            appearances: 1,
            relationship: person.relationship,
            referenceImageUrl: person.referenceImageUrl,
            dreamIds: [dream.id],
          });
        }
      }
    }

    return Array.from(map.values()).sort((a, b) => b.appearances - a.appearances);
  },

  async listPersonReferences(userId: string) {
    const store = await ensureStore();
    return store.personReferences.filter((r) => r.userId === userId);
  },

  async deleteAudioMedia(userId: string, dreamId: string): Promise<boolean> {
    const store = await ensureStore();
    const dream = store.dreams.find((d) => d.id === dreamId && d.userId === userId);
    if (!dream) return false;
    dream.media = dream.media.filter((m) => m.kind !== "audio");
    dream.retainAudio = false;
    dream.updatedAt = new Date().toISOString();
    await writeStore(store);
    return true;
  },

  async deleteAccount(userId: string): Promise<boolean> {
    const store = await ensureStore();
    store.dreams = store.dreams.filter((d) => d.userId !== userId);
    store.personReferences = store.personReferences.filter((r) => r.userId !== userId);
    store.users = store.users.filter((u) => u.id !== userId);
    await writeStore(store);
    return true;
  },

  async reassignDreams(fromUserId: string, toUserId: string): Promise<number> {
    const store = await ensureStore();
    let moved = 0;
    for (const dream of store.dreams) {
      if (dream.userId === fromUserId) {
        dream.userId = toUserId;
        moved += 1;
      }
    }
    for (const ref of store.personReferences) {
      if (ref.userId === fromUserId) {
        ref.userId = toUserId;
      }
    }
    await writeStore(store);
    return moved;
  },

  async replaceAllDreams(userId: string, dreams: Dream[]): Promise<void> {
    const store = await ensureStore();
    store.dreams = [
      ...dreams.map((d) => ({ ...d, userId })),
      ...store.dreams.filter((d) => d.userId !== userId),
    ];
    await writeStore(store);
  },

  async getStore(): Promise<StoreShape> {
    return ensureStore();
  },
};

export type { DreamAnalysis };
