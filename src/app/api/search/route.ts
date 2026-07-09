import { NextResponse } from "next/server";

import { getAllSongs, searchSongs } from "@/lib/queries";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  const songs = q ? await searchSongs(q) : (await getAllSongs()).slice(0, 30);
  return NextResponse.json(songs);
}
