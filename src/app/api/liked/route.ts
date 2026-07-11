import { NextResponse } from "next/server";

import { getLikedSongIds } from "@/lib/queries";
import { getViewerId } from "@/lib/session";

export async function GET() {
  return NextResponse.json(await getLikedSongIds(await getViewerId()));
}
