import "server-only";

import { auth0 } from "@/lib/auth0";
import { prisma } from "@/lib/prisma";
import type { AuthUser } from "@/lib/types";

/** The signed-in user from the Auth0 session, or null. No database write. */
export async function getAuthUser(): Promise<AuthUser | null> {
  let session;
  try {
    session = await auth0.getSession();
  } catch {
    // if auth0 is unreachable or unconfigured, treat the visitor as logged-out
    // (demo mode) rather than crashing the whole app
    return null;
  }
  const u = session?.user;
  if (!u?.sub) return null;
  return {
    id: u.sub,
    email: u.email ?? null,
    name: u.name ?? null,
    image: u.picture ?? null,
  };
}

/** The signed-in user's id, or null for logged-out (demo) visitors. */
export async function getViewerId(): Promise<string | null> {
  return (await getAuthUser())?.id ?? null;
}

/** Require a signed-in user and upsert their row. Throws if not signed in. */
export async function requireUser() {
  const u = await getAuthUser();
  if (!u) throw new Error("Sign in required");
  return prisma.user.upsert({
    where: { id: u.id },
    create: { id: u.id, email: u.email, name: u.name, image: u.image },
    update: { email: u.email, name: u.name, image: u.image },
  });
}
