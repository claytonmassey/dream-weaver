"use client";

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";

// next-auth SessionProvider typings lag React 19's JSX namespace in some setups
const AuthSessionProvider = SessionProvider as unknown as (props: {
  children: ReactNode;
}) => ReactNode;

export function Providers({ children }: { children: ReactNode }) {
  return <AuthSessionProvider>{children}</AuthSessionProvider>;
}
