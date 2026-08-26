import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import type { Provider } from "next-auth/providers";
import bcrypt from "bcryptjs";
import { userStore } from "@/lib/db/user-store";

const providers: Provider[] = [
  Credentials({
    name: "Email",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      try {
        const email = credentials?.email?.toString().toLowerCase().trim();
        const password = credentials?.password?.toString() ?? "";
        if (!email || !password) return null;

        if (
          process.env.DEMO_MODE === "true" &&
          email === "demo@dreamline.app" &&
          password === "dreamline"
        ) {
          const user = await userStore.getOrCreateDemoUser();
          return {
            id: user.id,
            email: user.email,
            name: user.name ?? "Demo Dreamer",
          };
        }

        const user = await userStore.findByEmail(email);
        if (!user?.passwordHash) return null;
        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;
        return {
          id: user.id,
          email: user.email,
          name: user.name ?? undefined,
          image: user.image ?? undefined,
        };
      } catch (error) {
        console.error("[auth] authorize failed", error);
        return null;
      }
    },
  }),
];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async signIn({ user, account }) {
      try {
        if (account?.provider === "google" && user.email) {
          const email = user.email.toLowerCase().trim();
          const existing = await userStore.findByEmail(email);
          if (!existing) {
            await userStore.create({
              email,
              name: user.name ?? undefined,
              image: user.image ?? undefined,
            });
          } else if (!existing.image && user.image) {
            await userStore.updateProfile(existing.id, {
              image: user.image,
              name: existing.name ?? user.name ?? null,
            });
          }
        }
        return true;
      } catch (error) {
        console.error("[auth] signIn callback failed", error);
        return false;
      }
    },
    async jwt({ token, user, account, trigger, session }) {
      if (user) {
        // Google IDs are not our DB ids — resolve by email.
        if (account?.provider === "google" && user.email) {
          try {
            const dbUser = await userStore.findByEmail(
              user.email.toLowerCase().trim(),
            );
            if (dbUser) {
              token.sub = dbUser.id;
              token.email = dbUser.email;
              token.name = dbUser.name ?? user.name;
              token.picture = dbUser.image ?? user.image;
              return token;
            }
          } catch (error) {
            console.error("[auth] google jwt resolve failed", error);
          }
        }

        if (user.id) token.sub = user.id;
        if (user.email) token.email = user.email;
        if (user.name) token.name = user.name;
        if (user.image) token.picture = user.image;
        return token;
      }

      if (trigger === "update" && session) {
        if (typeof session.name === "string") {
          token.name = session.name;
        }
        if (session.name === null) {
          token.name = null;
        }
      }

      if ((!token.email || !token.name) && token.sub) {
        try {
          const dbUser = await userStore.findById(token.sub);
          if (dbUser) {
            token.email = dbUser.email;
            token.name = dbUser.name;
            if (dbUser.image) token.picture = dbUser.image;
          }
        } catch (error) {
          console.error("[auth] jwt enrichment failed", error);
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.email = (token.email as string) ?? session.user.email;
        session.user.name =
          (token.name as string | null | undefined) ?? session.user.name;
        if (token.picture) {
          session.user.image = token.picture as string;
        }
      }
      return session;
    },
  },
  trustHost: true,
  secret:
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    "dreamline-dev-secret-change-me",
});
