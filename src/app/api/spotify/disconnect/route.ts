import { NextResponse } from "next/server";

import { getAuthUser } from "@/lib/session";
import { disconnectSpotify } from "@/lib/spotify";

const base = () => process.env.APP_BASE_URL ?? "http://localhost:3000";

export async function GET() {
  const user = await getAuthUser();
  if (user) await disconnectSpotify(user.id);
  return NextResponse.redirect(new URL("/?spotify=disconnected", base()));
}
