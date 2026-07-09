import { NextResponse } from "next/server";

import { getLikedSongIds } from "@/lib/queries";

export async function GET() {
  return NextResponse.json(await getLikedSongIds());
}
