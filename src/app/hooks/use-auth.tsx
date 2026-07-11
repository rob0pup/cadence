"use client";

import * as React from "react";
import { toast } from "sonner";

import type { AuthUser } from "@/lib/types";

export type SpotifyState = {
  displayName: string | null;
  product: string | null;
} | null;

type AuthContextType = {
  user: AuthUser | null;
  spotify: SpotifyState;
  /**
   * Returns true if signed in. If not, shows a prompt and sends the visitor to
   * the sign-in page, returning false so the caller can bail out of a write.
   */
  ensureSignedIn: () => boolean;
};

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({
  user,
  spotify = null,
  children,
}: {
  user: AuthUser | null;
  spotify?: SpotifyState;
  children: React.ReactNode;
}) {
  const ensureSignedIn = React.useCallback(() => {
    if (user) return true;
    toast("Sign in to do that", {
      action: {
        label: "Sign in",
        onClick: () => {
          window.location.href = `/auth/login?returnTo=${encodeURIComponent(
            window.location.pathname,
          )}`;
        },
      },
    });
    return false;
  }, [user]);

  const value = React.useMemo(
    () => ({ user, spotify, ensureSignedIn }),
    [user, spotify, ensureSignedIn],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (ctx === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
