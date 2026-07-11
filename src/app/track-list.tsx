"use client";

import {
  CornerDownRight,
  Heart,
  ListPlus,
  MoreHorizontal,
  Pause,
  Play,
  Shuffle,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { usePlayback } from "@/app/playback-context";
import {
  addSongToPlaylistAction,
  recordPlayAction,
  removeSongFromPlaylistAction,
  reorderPlaylistAction,
  toggleLikeAction,
} from "@/app/actions";
import { useAuth } from "@/app/hooks/use-auth";
import { CoverArt } from "@/components/cover-art";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  reorderable = false,
  playlistId,
}: {
  songs: Song[];
  likedIds?: string[];
  playlists?: Playlist[];
  query?: string;
  reorderable?: boolean;
  playlistId?: string;
}) {
  const {
    currentTrack,
    isPlaying,
    playTrack,
    playAll,
    togglePlayPause,
    playNext,
    addToQueue,
  } = usePlayback();
  const router = useRouter();
  const { ensureSignedIn } = useAuth();
  const [liked, setLiked] = React.useState<Set<string>>(new Set(likedIds));
  const [ordered, setOrdered] = React.useState<Song[]>(songs);
  const dragIndex = React.useRef<number | null>(null);
  const [selected, setSelected] = React.useState(-1);
  const tableRef = React.useRef<HTMLTableElement>(null);

  React.useEffect(() => setLiked(new Set(likedIds)), [likedIds]);
  React.useEffect(() => setOrdered(songs), [songs]);
  React.useEffect(() => setSelected(-1), [songs]);

  const list = reorderable ? ordered : songs;

  function onPlay(song: Song) {
    if (currentTrack?.id === song.id) {
      togglePlayPause();
    } else {
      playTrack(song, list);
      void recordPlayAction(song.id);
    }
  }

  function onDrop(toIndex: number) {
    const from = dragIndex.current;
    dragIndex.current = null;
    if (from === null || from === toIndex) return;
    if (!ensureSignedIn()) return;
    const next = [...ordered];
    const [moved] = next.splice(from, 1);
    next.splice(toIndex, 0, moved);
    setOrdered(next);
    if (playlistId) {
      void reorderPlaylistAction(
        playlistId,
        next.map((s) => s.id),
      );
    }
  }

  function onToggleLike(song: Song) {
    if (!ensureSignedIn()) return;
    setLiked((prev) => {
      const next = new Set(prev);
      if (next.has(song.id)) next.delete(song.id);
      else next.add(song.id);
      return next;
    });
    void toggleLikeAction(song.id);
  }

  // vim-style keyboard navigation over the list
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (
        t &&
        (t.tagName === "INPUT" ||
          t.tagName === "TEXTAREA" ||
          t.isContentEditable)
      )
        return;
      if (document.querySelector('[role="dialog"]')) return; // a modal is open
      const n = list.length;
      if (n === 0) return;
      if (e.key === "j" || e.key === "ArrowDown") {
        e.preventDefault();
        setSelected((i) => (i < 0 ? 0 : Math.min(i + 1, n - 1)));
      } else if (e.key === "k" || e.key === "ArrowUp") {
        e.preventDefault();
        setSelected((i) => (i <= 0 ? 0 : i - 1));
      } else if (e.key === "Enter") {
        setSelected((i) => {
          if (i >= 0 && i < n) onPlay(list[i]);
          return i;
        });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list]);

  React.useEffect(() => {
    if (selected < 0) return;
    const rows = tableRef.current?.querySelectorAll("tbody tr");
    rows?.[selected]?.scrollIntoView({ block: "nearest" });
  }, [selected]);

  if (list.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center py-24 text-sm text-muted-foreground">
        {query ? `No results for "${query}"` : "No tracks yet"}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 px-4 py-3">
        <Button size="sm" onClick={() => playAll(list)}>
          <Play className="size-4 fill-current" />
          Play
        </Button>
        <Button variant="outline" size="sm" onClick={() => playAll(list, true)}>
          <Shuffle className="size-4" />
          Shuffle
        </Button>
      </div>
      <table ref={tableRef} className="w-full text-sm">
        <thead className="screen-line-bottom sticky top-0 z-10 bg-background/80 backdrop-blur">
        <tr className="text-left text-xs text-muted-foreground">
          <th className="w-10 py-2 pr-2 pl-4 font-medium">#</th>
          <th className="py-2 px-2 font-medium">Title</th>
          <th className="hidden py-2 px-2 font-medium sm:table-cell">Artist</th>
          <th className="hidden py-2 px-2 font-medium md:table-cell">Album</th>
          <th className="w-16 py-2 px-2 text-right font-medium">Time</th>
          <th className="w-16 py-2 px-2" />
        </tr>
      </thead>
      <tbody>
        {list.map((song, index) => {
          const isCurrent = currentTrack?.id === song.id;
          const isLiked = liked.has(song.id);
          return (
            <tr
              key={song.id}
              draggable={reorderable}
              onDragStart={() => {
                dragIndex.current = index;
              }}
              onDragOver={(e) => {
                if (reorderable) e.preventDefault();
              }}
              onDrop={() => onDrop(index)}
              onClick={() => setSelected(index)}
              onDoubleClick={() => onPlay(song)}
              className={cn(
                "group cursor-default border-b border-line/60 hover:bg-muted/50",
                isCurrent && "bg-muted/60",
                selected === index && "bg-muted ring-1 ring-inset ring-ring/60",
                reorderable && "cursor-grab active:cursor-grabbing",
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
                  <CoverArt
                    url={song.imageUrl}
                    name={song.name}
                    sizes="32px"
                    className="size-8 shrink-0"
                  />
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
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        aria-label="more"
                        className="opacity-0 group-hover:opacity-100 aria-expanded:opacity-100"
                      >
                        <MoreHorizontal className="size-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => playNext(song)}>
                        <CornerDownRight />
                        Play next
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => addToQueue(song)}>
                        <ListPlus />
                        Add to queue
                      </DropdownMenuItem>
                      {(playlists.length > 0 || playlistId) && (
                        <DropdownMenuSeparator />
                      )}
                      {playlists.length > 0 && (
                        <>
                          <DropdownMenuLabel>Add to playlist</DropdownMenuLabel>
                          {playlists.map((p) => (
                            <DropdownMenuItem
                              key={p.id}
                              onSelect={async () => {
                                if (!ensureSignedIn()) return;
                                const res = await addSongToPlaylistAction(
                                  p.id,
                                  song.id,
                                );
                                toast(res.message);
                              }}
                            >
                              {p.name}
                            </DropdownMenuItem>
                          ))}
                        </>
                      )}
                      {playlistId && (
                        <>
                          {playlists.length > 0 && <DropdownMenuSeparator />}
                          <DropdownMenuItem
                            className="text-destructive"
                            onSelect={async () => {
                              if (!ensureSignedIn()) return;
                              await removeSongFromPlaylistAction(
                                playlistId,
                                song.id,
                              );
                              router.refresh();
                            }}
                          >
                            <Trash2 />
                            Remove from playlist
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
      </table>
    </div>
  );
}
