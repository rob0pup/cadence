import { notFound } from "next/navigation";
import { Suspense } from "react";

import { SharePlaylist } from "@/app/share-playlist";
import { TrackList } from "@/app/track-list";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  getAllPlaylists,
  getLikedSongIds,
  getPlaylistWithSongs,
} from "@/lib/queries";
import { getViewerId } from "@/lib/session";
import { formatDuration } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function PlaylistView({ id }: { id: string }) {
  const userId = await getViewerId();
  const [playlist, likedIds, playlists] = await Promise.all([
    getPlaylistWithSongs(id, userId),
    getLikedSongIds(userId),
    getAllPlaylists(userId),
  ]);
  if (!playlist) notFound();

  const isOwner = !!userId && playlist.ownerId === userId;

  return (
    <>
      <header className="screen-line-bottom flex h-14 items-center justify-between gap-3 px-6">
        <h1 className="truncate text-lg font-medium tracking-tight">
          {playlist.name}
        </h1>
        <div className="flex shrink-0 items-center gap-3">
          <span className="text-xs text-muted-foreground">
            {playlist.trackCount} tracks · {formatDuration(playlist.duration)}
          </span>
          {isOwner && (
            <SharePlaylist id={playlist.id} isPublic={playlist.isPublic} />
          )}
        </div>
      </header>
      <ScrollArea className="min-h-0 flex-1">
        <TrackList
          songs={playlist.songs}
          likedIds={likedIds}
          playlists={playlists}
          reorderable={isOwner}
          playlistId={isOwner ? playlist.id : undefined}
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
