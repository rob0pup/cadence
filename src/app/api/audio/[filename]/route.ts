import { promises as fs } from "fs";
import path from "path";

import { NextResponse } from "next/server";

// Streams local audio files placed in a top-level `tracks/` folder.
// Remote (Vercel Blob) urls are played directly and never hit this route.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ filename: string }> },
) {
  const { filename } = await params;
  const dir = path.join(process.cwd(), "tracks");
  const filePath = path.join(dir, path.basename(filename));

  // guard against path traversal
  if (!filePath.startsWith(dir)) {
    return new NextResponse("Not found", { status: 404 });
  }

  try {
    const file = await fs.readFile(filePath);
    return new NextResponse(new Uint8Array(file), {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": file.byteLength.toString(),
        "Accept-Ranges": "bytes",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
