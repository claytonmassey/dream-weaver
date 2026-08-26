import { localDb } from "@/lib/db/local-store";
import { prismaDb } from "@/lib/db/prisma-store";
import { usePrisma } from "@/lib/db/prisma";
import type { UserAccount } from "@/types/dream";

function db() {
  return usePrisma() ? prismaDb : localDb;
}

export const userStore = {
  findByEmail(email: string): Promise<UserAccount | null> {
    return db().findUserByEmail(email);
  },

  findById(id: string): Promise<UserAccount | null> {
    return db().findUserById(id);
  },

  create(input: {
    email: string;
    name?: string;
    passwordHash?: string;
    image?: string;
  }): Promise<UserAccount> {
    return db().createUser(input);
  },

  getOrCreateDemoUser(): Promise<UserAccount> {
    return db().getOrCreateDemoUser();
  },

  updatePassword(email: string, passwordHash: string) {
    return db().updateUserPassword(email, passwordHash);
  },
};
