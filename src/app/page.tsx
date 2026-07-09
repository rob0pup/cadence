import { Suspense } from "react";

import { TrackList } from "@/app/track-list";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  getAllPlaylists,
  getAllSongs,
  getLikedSongIds,
  searchSongs,
} from "@/lib/queries";

export const dynamic = "force-dynamic";

async function Tracks({ q }: { q: string }) {
  const [songs, likedIds, playlists] = await Promise.all([
    q ? searchSongs(q) : getAllSongs(),
    getLikedSongIds(),
    getAllPlaylists(),
  ]);
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
      <header className="screen-line-bottom flex h-14 items-center px-6">
        <h1 className="text-lg font-medium tracking-tight">
          {q ? `search: ${q}` : "all tracks"}
        </h1>
      </header>
      <ScrollArea className="min-h-0 flex-1">
        <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">loading…</div>}>
          <Tracks q={q} />
        </Suspense>
      </ScrollArea>
    </div>
  );
}
