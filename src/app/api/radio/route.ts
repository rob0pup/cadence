import { NextResponse } from "next/server";

import { getRelatedSongs } from "@/lib/queries";
import { getViewerId } from "@/lib/session";

export async function GET(req: Request) {
  const seed = new URL(req.url).searchParams.get("seed");
  if (!seed) return NextResponse.json([]);
  return NextResponse.json(await getRelatedSongs(seed, await getViewerId()));
}
