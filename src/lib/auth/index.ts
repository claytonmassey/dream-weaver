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
          const existing = await userStore.findByEmail(user.email);
          if (!existing) {
            await userStore.create({
              email: user.email,
              name: user.name ?? undefined,
              image: user.image ?? undefined,
            });
          }
        }
        return true;
      } catch (error) {
        console.error("[auth] signIn callback failed", error);
        return false;
      }
    },
    async jwt({ token, user }) {
      // Prefer the authorize/user payload — avoid an extra DB round-trip that
      // can fail if the Postgres connection was dropped mid-request.
      if (user) {
        if (user.id) token.sub = user.id;
        if (user.email) token.email = user.email;
        if (user.name) token.name = user.name;
        return token;
      }

      if ((!token.email || !token.name) && token.sub) {
        try {
          const dbUser = await userStore.findById(token.sub);
          if (dbUser) {
            token.email = dbUser.email;
            token.name = dbUser.name;
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
        session.user.name = (token.name as string) ?? session.user.name;
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
