import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getAuthUser } from "@/lib/session";
import { exchangeCode } from "@/lib/spotify";

const base = () => process.env.APP_BASE_URL ?? "http://localhost:3000";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  const jar = await cookies();
  const saved = jar.get("spotify_oauth_state")?.value;
  jar.delete("spotify_oauth_state");

  const user = await getAuthUser();
  if (!user || !code || !state || state !== saved) {
    return NextResponse.redirect(new URL("/?spotify=error", base()));
  }

  try {
    await exchangeCode(code, user.id);
    return NextResponse.redirect(new URL("/?spotify=connected", base()));
  } catch {
    return NextResponse.redirect(new URL("/?spotify=error", base()));
  }
}
