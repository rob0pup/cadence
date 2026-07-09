"use client";

import { Heart, Pause, Play, Plus } from "lucide-react";
import Image from "next/image";
import * as React from "react";
import { toast } from "sonner";

import { usePlayback } from "@/app/playback-context";
import {
  addSongToPlaylistAction,
  recordPlayAction,
  toggleLikeAction,
} from "@/app/actions";
import { Button } from "@/components/ui/button";
import type { Playlist, Song } from "@/lib/types";
import { cn, formatDuration } from "@/lib/utils";

function Highlight({ text, query }: { text: string; query?: string }) {
  if (!query) return <>{text}</>;
  const i = text.toLowerCase().indexOf(query.toLowerCase());
  if (i === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <mark className="bg-transparent text-foreground underline decoration-muted-foreground/60 underline-offset-2">
        {text.slice(i, i + query.length)}
      </mark>
      {text.slice(i + query.length)}
    </>
  );
}

function EqualizerBars() {
  return (
    <span className="flex h-3 items-end gap-px">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-0.5 animate-pulse rounded-full bg-foreground"
          style={{
            height: `${[60, 100, 40][i]}%`,
            animationDelay: `${i * 150}ms`,
            animationDuration: "700ms",
          }}
        />
      ))}
    </span>
  );
}

export function TrackList({
  songs,
  likedIds = [],
  playlists = [],
  query,
}: {
  songs: Song[];
  likedIds?: string[];
  playlists?: Playlist[];
  query?: string;
}) {
  const { currentTrack, isPlaying, playTrack, togglePlayPause } = usePlayback();
  const [liked, setLiked] = React.useState<Set<string>>(new Set(likedIds));

  React.useEffect(() => setLiked(new Set(likedIds)), [likedIds]);

  function onPlay(song: Song) {
    if (currentTrack?.id === song.id) {
      togglePlayPause();
    } else {
      playTrack(song, songs);
      void recordPlayAction(song.id);
    }
  }

  function onToggleLike(song: Song) {
    setLiked((prev) => {
      const next = new Set(prev);
      if (next.has(song.id)) next.delete(song.id);
      else next.add(song.id);
      return next;
    });
    void toggleLikeAction(song.id);
  }

  if (songs.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center py-24 text-sm text-muted-foreground">
        {query ? `no results for "${query}"` : "no tracks yet"}
      </div>
    );
  }

  return (
    <table className="w-full text-sm">
      <thead className="screen-line-bottom sticky top-0 z-10 bg-background/80 backdrop-blur">
        <tr className="text-left text-xs text-muted-foreground">
          <th className="w-10 py-2 pr-2 pl-4 font-medium">#</th>
          <th className="py-2 px-2 font-medium">title</th>
          <th className="hidden py-2 px-2 font-medium sm:table-cell">artist</th>
          <th className="hidden py-2 px-2 font-medium md:table-cell">album</th>
          <th className="w-16 py-2 px-2 text-right font-medium">time</th>
          <th className="w-16 py-2 px-2" />
        </tr>
      </thead>
      <tbody>
        {songs.map((song, index) => {
          const isCurrent = currentTrack?.id === song.id;
          const isLiked = liked.has(song.id);
          return (
            <tr
              key={song.id}
              onDoubleClick={() => onPlay(song)}
              className={cn(
                "group cursor-default border-b border-line/60 hover:bg-muted/50",
                isCurrent && "bg-muted/60",
              )}
            >
              <td className="py-1.5 pr-2 pl-4 text-center tabular-nums text-muted-foreground">
                <button
                  onClick={() => onPlay(song)}
                  className="grid size-5 place-items-center"
                  aria-label={isCurrent && isPlaying ? "pause" : "play"}
                >
                  {isCurrent && isPlaying ? (
                    <span className="group-hover:hidden">
                      <EqualizerBars />
                    </span>
                  ) : (
                    <span className="group-hover:hidden">{index + 1}</span>
                  )}
                  <span className="hidden group-hover:inline">
                    {isCurrent && isPlaying ? (
                      <Pause className="size-3.5 fill-current" />
                    ) : (
                      <Play className="size-3.5 fill-current" />
                    )}
                  </span>
                </button>
              </td>
              <td className="py-1.5 px-2">
                <div className="flex items-center gap-2.5">
                  <div className="relative size-8 shrink-0 overflow-hidden rounded bg-muted">
                    {song.imageUrl ? (
                      <Image
                        src={song.imageUrl}
                        alt=""
                        fill
                        sizes="32px"
                        className="object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0">
                    <div
                      className={cn(
                        "truncate font-medium",
                        isCurrent && "text-link",
                      )}
                    >
                      <Highlight text={song.name} query={query} />
                    </div>
                    <div className="truncate text-xs text-muted-foreground sm:hidden">
                      <Highlight text={song.artist} query={query} />
                    </div>
                  </div>
                </div>
              </td>
              <td className="hidden max-w-40 truncate py-1.5 px-2 text-muted-foreground sm:table-cell">
                <Highlight text={song.artist} query={query} />
              </td>
              <td className="hidden max-w-40 truncate py-1.5 px-2 text-muted-foreground md:table-cell">
                <Highlight text={song.album ?? ""} query={query} />
              </td>
              <td className="py-1.5 px-2 text-right tabular-nums text-muted-foreground">
                {formatDuration(song.duration)}
              </td>
              <td className="py-1.5 px-2">
                <div className="flex items-center justify-end gap-0.5">
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    aria-label={isLiked ? "unlike" : "like"}
                    className={cn(
                      "opacity-0 group-hover:opacity-100",
                      isLiked && "opacity-100",
                    )}
                    onClick={() => onToggleLike(song)}
                  >
                    <Heart
                      className={cn(
                        "size-3.5",
                        isLiked && "fill-link text-link",
                      )}
                    />
                  </Button>
                  {playlists.length > 0 && (
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      aria-label="add to playlist"
                      className="opacity-0 group-hover:opacity-100"
                      onClick={async () => {
                        const res = await addSongToPlaylistAction(
                          playlists[0].id,
                          song.id,
                        );
                        toast(res.message);
                      }}
                    >
                      <Plus className="size-3.5" />
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
