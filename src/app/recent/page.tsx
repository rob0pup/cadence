import { Suspense } from "react";

import { TrackList } from "@/app/track-list";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  getAllPlaylists,
  getLikedSongIds,
  getRecentlyPlayed,
} from "@/lib/queries";
import { getViewerId } from "@/lib/session";

export const dynamic = "force-dynamic";

async function RecentTracks() {
  const userId = await getViewerId();
  const [songs, likedIds, playlists] = await Promise.all([
    getRecentlyPlayed(userId),
    getLikedSongIds(userId),
    getAllPlaylists(userId),
  ]);
  return (
    <TrackList songs={songs} likedIds={likedIds} playlists={playlists} />
  );
}

export default function RecentPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="screen-line-bottom flex h-14 items-center px-6">
        <h1 className="text-lg font-medium tracking-tight">Recently Played</h1>
      </header>
      <ScrollArea className="min-h-0 flex-1">
        <Suspense
          fallback={
            <div className="p-6 text-sm text-muted-foreground">loading…</div>
          }
        >
          <RecentTracks />
        </Suspense>
      </ScrollArea>
    </div>
  );
}
