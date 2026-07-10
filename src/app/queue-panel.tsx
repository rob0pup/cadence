"use client";

import { X } from "lucide-react";

import { usePlayback } from "@/app/playback-context";
import { CoverArt } from "@/components/cover-art";
import { Button } from "@/components/ui/button";
import { cn, formatDuration } from "@/lib/utils";

export function QueuePanel() {
  const { queueOpen, toggleQueue, queue, currentTrack, playTrack } =
    usePlayback();

  if (!queueOpen) return null;

  const idx = currentTrack
    ? queue.findIndex((t) => t.id === currentTrack.id)
    : -1;
  const upcoming = idx >= 0 ? queue.slice(idx + 1) : queue;

  return (
    <aside className="fixed top-0 right-0 bottom-20 z-40 flex w-72 flex-col border-l bg-sidebar shadow-lg">
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-sm font-medium">Queue</span>
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label="close queue"
          onClick={toggleQueue}
        >
          <X className="size-3.5" />
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-4">
        {currentTrack && (
          <>
            <p className="px-2 py-1 text-xs text-muted-foreground">
              Now playing
            </p>
            <Row song={currentTrack} active onPlay={() => {}} />
          </>
        )}

        <p className="px-2 pt-3 pb-1 text-xs text-muted-foreground">Next up</p>
        {upcoming.length === 0 ? (
          <p className="px-2 py-4 text-xs text-muted-foreground">
            Nothing queued
          </p>
        ) : (
          upcoming.map((song) => (
            <Row key={song.id} song={song} onPlay={() => playTrack(song)} />
          ))
        )}
      </div>
    </aside>
  );
}

function Row({
  song,
  active = false,
  onPlay,
}: {
  song: { id: string; name: string; artist: string; duration: number; imageUrl: string | null };
  active?: boolean;
  onPlay: () => void;
}) {
  return (
    <button
      onClick={onPlay}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left hover:bg-muted",
        active && "bg-muted",
      )}
    >
      <CoverArt
        url={song.imageUrl}
        name={song.name}
        sizes="32px"
        className="size-8 shrink-0"
      />
      <div className="min-w-0 flex-1">
        <div className={cn("truncate text-sm", active && "text-link")}>
          {song.name}
        </div>
        <div className="truncate text-xs text-muted-foreground">
          {song.artist}
        </div>
      </div>
      <span className="text-xs tabular-nums text-muted-foreground">
        {formatDuration(song.duration)}
      </span>
    </button>
  );
}
