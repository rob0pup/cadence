import { notFound } from "next/navigation";
import { Suspense } from "react";

import { TrackList } from "@/app/track-list";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  getAllPlaylists,
  getLikedSongIds,
  getPlaylistWithSongs,
} from "@/lib/queries";
import { formatDuration } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function PlaylistView({ id }: { id: string }) {
  const [playlist, likedIds, playlists] = await Promise.all([
    getPlaylistWithSongs(id),
    getLikedSongIds(),
    getAllPlaylists(),
  ]);
  if (!playlist) notFound();

  return (
    <>
      <header className="screen-line-bottom flex h-14 items-center justify-between px-6">
        <h1 className="text-lg font-medium tracking-tight">{playlist.name}</h1>
        <span className="text-xs text-muted-foreground">
          {playlist.trackCount} tracks · {formatDuration(playlist.duration)}
        </span>
      </header>
      <ScrollArea className="min-h-0 flex-1">
        <TrackList
          songs={playlist.songs}
          likedIds={likedIds}
          playlists={playlists}
          reorderable
          playlistId={playlist.id}
        />
      </ScrollArea>
    </>
  );
}

export default async function PlaylistPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Suspense
        fallback={
          <div className="p-6 text-sm text-muted-foreground">loading…</div>
        }
      >
        <PlaylistView id={id} />
      </Suspense>
    </div>
  );
}
