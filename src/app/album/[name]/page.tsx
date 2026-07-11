import { Suspense } from "react";

import { TrackList } from "@/app/track-list";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  getAlbumSongs,
  getAllPlaylists,
  getLikedSongIds,
} from "@/lib/queries";
import { getViewerId } from "@/lib/session";
import { formatDuration } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function AlbumView({ name }: { name: string }) {
  const userId = await getViewerId();
  const [songs, likedIds, playlists] = await Promise.all([
    getAlbumSongs(name, userId),
    getLikedSongIds(userId),
    getAllPlaylists(userId),
  ]);
  const total = songs.reduce((t, s) => t + s.duration, 0);
  return (
    <>
      <header className="screen-line-bottom flex h-14 items-center justify-between px-6">
        <h1 className="truncate text-lg font-medium tracking-tight">{name}</h1>
        <span className="shrink-0 text-xs text-muted-foreground">
          {songs.length} tracks · {formatDuration(total)}
        </span>
      </header>
      <ScrollArea className="min-h-0 flex-1">
        <TrackList songs={songs} likedIds={likedIds} playlists={playlists} />
      </ScrollArea>
    </>
  );
}

export default async function AlbumPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Suspense
        fallback={
          <div className="p-6 text-sm text-muted-foreground">loading…</div>
        }
      >
        <AlbumView name={decodeURIComponent(name)} />
      </Suspense>
    </div>
  );
}
