import { Music2 } from "lucide-react";
import { Suspense } from "react";

import { TrackList } from "@/app/track-list";
import { UploadButton } from "@/app/upload-button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  getAllPlaylists,
  getAllSongs,
  getLikedSongIds,
  searchSongs,
} from "@/lib/queries";
import { getViewerId } from "@/lib/session";

export const dynamic = "force-dynamic";

async function Tracks({ q }: { q: string }) {
  const userId = await getViewerId();
  const [songs, likedIds, playlists] = await Promise.all([
    q ? searchSongs(q, userId) : getAllSongs(userId),
    getLikedSongIds(userId),
    getAllPlaylists(userId),
  ]);

  if (!q && songs.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-center">
        <div className="grid size-14 place-items-center rounded-full bg-muted text-muted-foreground">
          <Music2 className="size-6" />
        </div>
        <div>
          <h2 className="text-lg font-medium tracking-tight">
            Your library is empty
          </h2>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            import a few mp3s to get started. cadence reads the title, artist,
            album, and cover art from each file.
          </p>
        </div>
        <UploadButton />
      </div>
    );
  }

  return (
    <TrackList
      songs={songs}
      likedIds={likedIds}
      playlists={playlists}
      query={q || undefined}
    />
  );
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const q = (await searchParams).q ?? "";

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="screen-line-bottom flex h-14 items-center justify-between px-6">
        <h1 className="text-lg font-medium tracking-tight">
          {q ? `Search: ${q}` : "All Tracks"}
        </h1>
        <UploadButton />
      </header>
      <ScrollArea className="min-h-0 flex-1">
        <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">loading…</div>}>
          <Tracks q={q} />
        </Suspense>
      </ScrollArea>
    </div>
  );
}
