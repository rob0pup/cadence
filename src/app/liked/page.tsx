import { Suspense } from "react";

import { TrackList } from "@/app/track-list";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getAllPlaylists, getLikedSongs } from "@/lib/queries";

export const dynamic = "force-dynamic";

async function LikedTracks() {
  const [songs, playlists] = await Promise.all([
    getLikedSongs(),
    getAllPlaylists(),
  ]);
  return (
    <TrackList
      songs={songs}
      likedIds={songs.map((s) => s.id)}
      playlists={playlists}
    />
  );
}

export default function LikedPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="screen-line-bottom flex h-14 items-center px-6">
        <h1 className="text-lg font-medium tracking-tight">Liked Songs</h1>
      </header>
      <ScrollArea className="min-h-0 flex-1">
        <Suspense
          fallback={
            <div className="p-6 text-sm text-muted-foreground">loading…</div>
          }
        >
          <LikedTracks />
        </Suspense>
      </ScrollArea>
    </div>
  );
}
