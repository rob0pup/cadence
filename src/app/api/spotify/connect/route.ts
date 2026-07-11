import { randomUUID } from "crypto";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getAuthUser } from "@/lib/session";
import { getAuthorizeUrl, isSpotifyConfigured } from "@/lib/spotify";

const base = () => process.env.APP_BASE_URL ?? "http://localhost:3000";

export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.redirect(new URL("/auth/login", base()));
  if (!isSpotifyConfigured()) {
    return NextResponse.redirect(new URL("/?spotify=unconfigured", base()));
  }

  const state = randomUUID();
  const jar = await cookies();
  jar.set("spotify_oauth_state", state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  return NextResponse.redirect(getAuthorizeUrl(state));
}
