import "server-only";

import { prisma } from "@/lib/prisma";

const AUTH_URL = "https://accounts.spotify.com/authorize";
const TOKEN_URL = "https://accounts.spotify.com/api/token";
const API = "https://api.spotify.com/v1";

export const SPOTIFY_SCOPES = [
  "streaming",
  "user-read-email",
  "user-read-private",
  "user-library-read",
  "playlist-read-private",
  "user-read-playback-state",
  "user-modify-playback-state",
].join(" ");

const clientId = () => process.env.SPOTIFY_CLIENT_ID ?? "";
const clientSecret = () => process.env.SPOTIFY_CLIENT_SECRET ?? "";
const redirectUri = () =>
  `${process.env.APP_BASE_URL ?? "http://localhost:3000"}/api/spotify/callback`;

export function isSpotifyConfigured() {
  return !!clientId() && !!clientSecret();
}

export function getAuthorizeUrl(state: string) {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId(),
    scope: SPOTIFY_SCOPES,
    redirect_uri: redirectUri(),
    state,
  });
  return `${AUTH_URL}?${params.toString()}`;
}

type TokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope?: string;
};

async function tokenRequest(
  body: Record<string, string>,
): Promise<TokenResponse> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization:
        "Basic " +
        Buffer.from(`${clientId()}:${clientSecret()}`).toString("base64"),
    },
    body: new URLSearchParams(body),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`spotify token request failed: ${res.status}`);
  return res.json();
}

export async function exchangeCode(code: string, userId: string) {
  const tok = await tokenRequest({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri(),
  });
  const expiresAt = new Date(Date.now() + tok.expires_in * 1000);

  let spotifyId: string | null = null;
  let displayName: string | null = null;
  let product: string | null = null;
  try {
    const me = await fetch(`${API}/me`, {
      headers: { Authorization: `Bearer ${tok.access_token}` },
      cache: "no-store",
    }).then((r) => r.json());
    spotifyId = me.id ?? null;
    displayName = me.display_name ?? null;
    product = me.product ?? null;
  } catch {
    // profile is best-effort
  }

  await prisma.spotifyAccount.upsert({
    where: { userId },
    create: {
      userId,
      accessToken: tok.access_token,
      refreshToken: tok.refresh_token ?? "",
      expiresAt,
      scope: tok.scope,
      spotifyId,
      displayName,
      product,
    },
    update: {
      accessToken: tok.access_token,
      refreshToken: tok.refresh_token || undefined,
      expiresAt,
      scope: tok.scope,
      spotifyId,
      displayName,
      product,
    },
  });
}

/** A valid access token for the user, refreshing if needed, or null. */
export async function getAccessToken(userId: string): Promise<string | null> {
  const acct = await prisma.spotifyAccount.findUnique({ where: { userId } });
  if (!acct) return null;
  if (acct.expiresAt.getTime() > Date.now() + 30_000) return acct.accessToken;
  try {
    const tok = await tokenRequest({
      grant_type: "refresh_token",
      refresh_token: acct.refreshToken,
    });
    await prisma.spotifyAccount.update({
      where: { userId },
      data: {
        accessToken: tok.access_token,
        refreshToken: tok.refresh_token || acct.refreshToken,
        expiresAt: new Date(Date.now() + tok.expires_in * 1000),
        scope: tok.scope ?? acct.scope,
      },
    });
    return tok.access_token;
  } catch {
    return null;
  }
}

export async function spotifyFetch<T>(
  userId: string,
  path: string,
): Promise<T | null> {
  const token = await getAccessToken(userId);
  if (!token) return null;
  const res = await fetch(`${API}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) return null;
  return res.json();
}

export type SpotifyStatus = {
  displayName: string | null;
  product: string | null;
};

export async function getSpotifyStatus(
  userId: string | null,
): Promise<SpotifyStatus | null> {
  if (!userId) return null;
  return prisma.spotifyAccount.findUnique({
    where: { userId },
    select: { displayName: true, product: true },
  });
}

export async function disconnectSpotify(userId: string) {
  await prisma.spotifyAccount.deleteMany({ where: { userId } });
}
