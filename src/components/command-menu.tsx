"use client";

import { Clock, Heart, Music2, Play } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";

import { recordPlayAction } from "@/app/actions";
import { usePlayback } from "@/app/playback-context";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import type { Song } from "@/lib/types";

export function CommandMenu() {
  const router = useRouter();
  const { playTrack } = usePlayback();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<Song[]>([]);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  React.useEffect(() => {
    if (!open) return;
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(query)}`,
          { signal: ctrl.signal },
        );
        setResults(await res.json());
      } catch {
        // aborted or failed; leave prior results
      }
    }, 200);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [query, open]);

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  function play(song: Song) {
    setOpen(false);
    playTrack(song, results);
    void recordPlayAction(song.id);
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="search songs, jump to a page…"
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>no results.</CommandEmpty>
        <CommandGroup heading="go to">
          <CommandItem value="all tracks" onSelect={() => go("/")}>
            <Music2 className="size-4" />
            all tracks
          </CommandItem>
          <CommandItem value="liked songs" onSelect={() => go("/liked")}>
            <Heart className="size-4" />
            liked songs
          </CommandItem>
          <CommandItem value="recently played" onSelect={() => go("/recent")}>
            <Clock className="size-4" />
            recently played
          </CommandItem>
        </CommandGroup>
        {results.length > 0 && (
          <CommandGroup heading="songs">
            {results.map((song) => (
              <CommandItem
                key={song.id}
                value={`${song.name} ${song.artist} ${song.id}`}
                onSelect={() => play(song)}
              >
                <Play className="size-4 fill-current" />
                <span className="truncate">
                  {song.name}
                  <span className="text-muted-foreground"> · {song.artist}</span>
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
