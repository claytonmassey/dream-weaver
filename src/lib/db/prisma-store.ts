import { prisma } from "@/lib/db/prisma";
import type {
  CreateDreamInput,
  Dream,
  DreamAnalysis,
  DreamListItem,
  DreamMedia,
  DreamPerson,
  DreamVisualStyle,
  UserAccount,
} from "@/types/dream";
import type {
  Dream as PrismaDream,
  DreamEvent as PrismaDreamEvent,
  DreamMedia as PrismaDreamMedia,
  DreamPerson as PrismaDreamPerson,
  User,
} from "@prisma/client";

type DreamWithRelations = PrismaDream & {
  people: PrismaDreamPerson[];
  events: PrismaDreamEvent[];
  media: PrismaDreamMedia[];
};

function toUserAccount(user: User): UserAccount {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    image: user.image,
    passwordHash: user.passwordHash,
    createdAt: user.createdAt.toISOString(),
  };
}

function toDream(dream: DreamWithRelations): Dream {
  return {
    id: dream.id,
    userId: dream.userId,
    createdAt: dream.createdAt.toISOString(),
    updatedAt: dream.updatedAt.toISOString(),
    dreamDate: dream.dreamDate.toISOString(),
    rawTranscript: dream.rawTranscript,
    cleanedTranscript: dream.cleanedTranscript,
    title: dream.title,
    summary: dream.summary,
    mood: dream.mood,
    emotions: dream.emotions,
    locations: dream.locations,
    objects: dream.objects,
    analysisJson: dream.analysisJson as DreamAnalysis,
    imageUrl: dream.imageUrl,
    visualStyle: dream.visualStyle as DreamVisualStyle,
    retainAudio: dream.retainAudio,
    imageStatus: dream.imageStatus as Dream["imageStatus"],
    people: dream.people.map((p) => ({
      id: p.id,
      dreamId: p.dreamId,
      name: p.name,
      description: p.description,
      relationship: p.relationship,
      isRealPerson: p.isRealPerson,
      referenceImageUrl: p.referenceImageUrl,
    })),
    events: dream.events
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((e) => ({
        id: e.id,
        dreamId: e.dreamId,
        order: e.order,
        title: e.title,
        description: e.description,
        importance: e.importance,
      })),
    media: dream.media.map(
      (m): DreamMedia => ({
        id: m.id,
        dreamId: m.dreamId,
        kind: m.kind as DreamMedia["kind"],
        url: m.url,
        mimeType: m.mimeType,
        sizeBytes: m.sizeBytes ?? undefined,
        createdAt: m.createdAt.toISOString(),
      }),
    ),
  };
}

function toListItem(dream: DreamWithRelations): DreamListItem {
  const full = toDream(dream);
  return {
    id: full.id,
    title: full.title,
    summary: full.summary,
    mood: full.mood,
    dreamDate: full.dreamDate,
    createdAt: full.createdAt,
    imageUrl: full.imageUrl,
    imageStatus: full.imageStatus,
    emotions: full.emotions,
    people: full.people.map((p) => ({
      id: p.id,
      name: p.name,
      isRealPerson: p.isRealPerson,
    })),
  };
}

const dreamInclude = {
  people: true,
  events: true,
  media: true,
} as const;

export const prismaDb = {
  async findUserByEmail(email: string): Promise<UserAccount | null> {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    return user ? toUserAccount(user) : null;
  },

  async findUserById(id: string): Promise<UserAccount | null> {
    const user = await prisma.user.findUnique({ where: { id } });
    return user ? toUserAccount(user) : null;
  },

  async createUser(input: {
    email: string;
    name?: string;
    passwordHash?: string;
    image?: string;
  }): Promise<UserAccount> {
    const email = input.email.toLowerCase().trim();
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return toUserAccount(existing);

    const user = await prisma.user.create({
      data: {
        email,
        name: input.name ?? null,
        passwordHash: input.passwordHash ?? null,
        image: input.image ?? null,
      },
    });
    return toUserAccount(user);
  },

  async updateUserPassword(
    email: string,
    passwordHash: string,
  ): Promise<UserAccount | null> {
    const normalized = email.toLowerCase().trim();
    try {
      const user = await prisma.user.update({
        where: { email: normalized },
        data: { passwordHash },
      });
      return toUserAccount(user);
    } catch {
      return null;
    }
  },

  async getOrCreateDemoUser(): Promise<UserAccount> {
    const existing = await prisma.user.findUnique({
      where: { email: "demo@dreamline.app" },
    });
    if (existing) return toUserAccount(existing);

    const bcrypt = await import("bcryptjs");
    const passwordHash = await bcrypt.hash("dreamline", 10);
    const user = await prisma.user.create({
      data: {
        email: "demo@dreamline.app",
        name: "Demo Dreamer",
        passwordHash,
      },
    });
    return toUserAccount(user);
  },

  async listDreams(userId: string): Promise<DreamListItem[]> {
    const dreams = await prisma.dream.findMany({
      where: { userId },
      include: dreamInclude,
      orderBy: { dreamDate: "desc" },
    });
    return dreams.map(toListItem);
  },

  async getDream(userId: string, dreamId: string): Promise<Dream | null> {
    const dream = await prisma.dream.findFirst({
      where: { id: dreamId, userId },
      include: dreamInclude,
    });
    return dream ? toDream(dream) : null;
  },

  async createDream(input: CreateDreamInput): Promise<Dream> {
    const analysis = input.analysis;
    const dream = await prisma.dream.create({
      data: {
        userId: input.userId,
        dreamDate: new Date(input.dreamDate),
        rawTranscript: input.rawTranscript,
        cleanedTranscript: input.cleanedTranscript,
        title: analysis.title,
        summary: analysis.summary,
        mood: analysis.mood,
        emotions: analysis.emotions,
        locations: analysis.locations,
        objects: analysis.importantObjects,
        analysisJson: analysis,
        visualStyle: input.visualStyle ?? "cinematic",
        retainAudio: input.retainAudio ?? false,
        imageStatus: "pending",
        people: {
          create: analysis.people.map((p) => ({
            name: p.name,
            description: p.description ?? null,
            relationship: p.relationship ?? null,
            isRealPerson: p.isRealPerson,
          })),
        },
        events: {
          create: analysis.majorEvents.map((e) => ({
            order: e.order,
            title: e.title,
            description: e.description,
            importance: e.importance,
          })),
        },
        media: input.audioUrl
          ? {
              create: [
                {
                  kind: "audio",
                  url: input.audioUrl,
                  mimeType: "audio/webm",
                },
              ],
            }
          : undefined,
      },
      include: dreamInclude,
    });
    return toDream(dream);
  },

  async updateDreamImage(
    userId: string,
    dreamId: string,
    imageUrl: string,
    status: "pending" | "ready" | "failed",
  ): Promise<Dream | null> {
    const existing = await prisma.dream.findFirst({
      where: { id: dreamId, userId },
    });
    if (!existing) return null;

    const dream = await prisma.dream.update({
      where: { id: dreamId },
      data: {
        imageStatus: status,
        ...(status === "ready" ? { imageUrl } : {}),
        ...(status === "ready"
          ? {
              media: {
                create: {
                  kind: "image",
                  url: imageUrl,
                  mimeType: imageUrl.endsWith(".svg")
                    ? "image/svg+xml"
                    : "image/png",
                },
              },
            }
          : {}),
      },
      include: dreamInclude,
    });
    return toDream(dream);
  },

  async setPersonReference(
    userId: string,
    dreamId: string,
    personId: string,
    imageUrl: string,
  ): Promise<DreamPerson | null> {
    const dream = await prisma.dream.findFirst({
      where: { id: dreamId, userId },
      include: { people: true },
    });
    if (!dream) return null;
    const person = dream.people.find((p) => p.id === personId);
    if (!person) return null;

    const updated = await prisma.dreamPerson.update({
      where: { id: personId },
      data: { referenceImageUrl: imageUrl },
    });

    await prisma.personReference.upsert({
      where: {
        userId_name: { userId, name: person.name },
      },
      create: {
        userId,
        name: person.name,
        imageUrl,
      },
      update: { imageUrl },
    });

    await prisma.dreamMedia.create({
      data: {
        dreamId,
        kind: "reference_photo",
        url: imageUrl,
        mimeType: "image/jpeg",
      },
    });

    return {
      id: updated.id,
      dreamId: updated.dreamId,
      name: updated.name,
      description: updated.description,
      relationship: updated.relationship,
      isRealPerson: updated.isRealPerson,
      referenceImageUrl: updated.referenceImageUrl,
    };
  },

  async deleteDream(userId: string, dreamId: string): Promise<boolean> {
    const result = await prisma.dream.deleteMany({
      where: { id: dreamId, userId },
    });
    return result.count > 0;
  },

  async deletePersonReferencePhoto(
    userId: string,
    referenceId: string,
  ): Promise<boolean> {
    const ref = await prisma.personReference.findFirst({
      where: { id: referenceId, userId },
    });
    if (!ref) return false;

    await prisma.personReference.delete({ where: { id: referenceId } });
    await prisma.dreamPerson.updateMany({
      where: {
        name: ref.name,
        dream: { userId },
      },
      data: { referenceImageUrl: null },
    });
    return true;
  },

  async listPeople(userId: string) {
    const people = await prisma.dreamPerson.findMany({
      where: { dream: { userId } },
      include: { dream: { select: { id: true } } },
    });

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

    for (const person of people) {
      const key = person.name.toLowerCase();
      const existing = map.get(key);
      if (existing) {
        existing.appearances += 1;
        existing.dreamIds.push(person.dream.id);
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
          dreamIds: [person.dream.id],
        });
      }
    }

    return Array.from(map.values()).sort(
      (a, b) => b.appearances - a.appearances,
    );
  },

  async listPersonReferences(userId: string) {
    return prisma.personReference.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    });
  },

  async deleteAudioMedia(userId: string, dreamId: string): Promise<boolean> {
    const dream = await prisma.dream.findFirst({
      where: { id: dreamId, userId },
    });
    if (!dream) return false;
    await prisma.dreamMedia.deleteMany({
      where: { dreamId, kind: "audio" },
    });
    await prisma.dream.update({
      where: { id: dreamId },
      data: { retainAudio: false },
    });
    return true;
  },

  async deleteAccount(userId: string): Promise<boolean> {
    await prisma.personReference.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });
    return true;
  },

  async replaceAllDreams(userId: string, dreams: Dream[]): Promise<void> {
    await prisma.dream.deleteMany({ where: { userId } });
    for (const dream of dreams) {
      await prisma.dream.create({
        data: {
          id: dream.id,
          userId,
          dreamDate: new Date(dream.dreamDate),
          createdAt: new Date(dream.createdAt),
          updatedAt: new Date(dream.updatedAt),
          rawTranscript: dream.rawTranscript,
          cleanedTranscript: dream.cleanedTranscript,
          title: dream.title,
          summary: dream.summary,
          mood: dream.mood,
          emotions: dream.emotions,
          locations: dream.locations,
          objects: dream.objects,
          analysisJson: dream.analysisJson,
          imageUrl: dream.imageUrl ?? null,
          visualStyle: dream.visualStyle,
          retainAudio: dream.retainAudio,
          imageStatus: dream.imageStatus,
          people: {
            create: dream.people.map((p) => ({
              id: p.id,
              name: p.name,
              description: p.description ?? null,
              relationship: p.relationship ?? null,
              isRealPerson: p.isRealPerson,
              referenceImageUrl: p.referenceImageUrl ?? null,
            })),
          },
          events: {
            create: dream.events.map((e) => ({
              id: e.id,
              order: e.order,
              title: e.title,
              description: e.description,
              importance: e.importance,
            })),
          },
          media: {
            create: dream.media.map((m) => ({
              id: m.id,
              kind: m.kind,
              url: m.url,
              mimeType: m.mimeType,
              sizeBytes: m.sizeBytes ?? null,
              createdAt: new Date(m.createdAt),
            })),
          },
        },
      });
    }
  },
};
