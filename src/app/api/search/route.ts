import { NextResponse } from "next/server";

import { getAllSongs, searchSongs } from "@/lib/queries";
import { getViewerId } from "@/lib/session";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  const userId = await getViewerId();
  const songs = q
    ? await searchSongs(q, userId)
    : (await getAllSongs(userId)).slice(0, 30);
  return NextResponse.json(songs);
}
