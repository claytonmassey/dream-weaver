import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import type { Provider } from "next-auth/providers";
import bcrypt from "bcryptjs";
import { localDb } from "@/lib/db/local-store";

const providers: Provider[] = [
  Credentials({
    name: "Email",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      const email = credentials?.email?.toString().toLowerCase().trim();
      const password = credentials?.password?.toString() ?? "";
      if (!email || !password) return null;

      if (email === "demo@dreamline.app" && password === "dreamline") {
        const user = await localDb.getOrCreateDemoUser();
        return {
          id: user.id,
          email: user.email,
          name: user.name ?? "Demo Dreamer",
        };
      }

      const user = await localDb.findUserByEmail(email);
      if (!user?.passwordHash) return null;
      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) return null;
      return {
        id: user.id,
        email: user.email,
        name: user.name ?? undefined,
        image: user.image ?? undefined,
      };
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
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.email) {
        const existing = await localDb.findUserByEmail(user.email);
        if (!existing) {
          await localDb.createUser({
            email: user.email,
            name: user.name ?? undefined,
            image: user.image ?? undefined,
          });
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        if (user.email) {
          const dbUser =
            (await localDb.findUserByEmail(user.email)) ??
            (await localDb.createUser({
              email: user.email,
              name: user.name ?? undefined,
              image: user.image ?? undefined,
            }));
          token.sub = dbUser.id;
          token.email = dbUser.email;
          token.name = dbUser.name;
        } else if (user.id) {
          token.sub = user.id;
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
  secret: process.env.AUTH_SECRET ?? "dreamline-dev-secret-change-me",
});
