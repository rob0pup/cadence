import { Clock, Disc3, Heart, Mic2, Music2 } from "lucide-react";
import Link from "next/link";

import { PlaylistNav } from "@/app/playlist-nav";
import { SearchInput } from "@/app/search";
import { LogoMark } from "@/components/logo-mark";
import { ThemeToggle } from "@/components/theme-toggle";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getAllPlaylists } from "@/lib/queries";
import type { Playlist } from "@/lib/types";

export async function Sidebar() {
  let playlists: Playlist[] = [];
  let failed = false;
  try {
    playlists = await getAllPlaylists();
  } catch {
    // keep the shell alive if the database is unreachable
    failed = true;
  }

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r bg-sidebar md:flex">
      <div className="flex items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-mono font-medium">
          <LogoMark className="h-4 w-[1.1rem]" />
          cadence
        </Link>
        <ThemeToggle />
      </div>

      <div className="px-3 pb-2">
        <SearchInput />
      </div>

      <nav className="flex flex-col px-3">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Music2 className="size-3.5" />
          all tracks
        </Link>
        <Link
          href="/liked"
          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Heart className="size-3.5" />
          liked songs
        </Link>
        <Link
          href="/recent"
          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Clock className="size-3.5" />
          recently played
        </Link>
        <Link
          href="/albums"
          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Disc3 className="size-3.5" />
          albums
        </Link>
        <Link
          href="/artists"
          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Mic2 className="size-3.5" />
          artists
        </Link>
      </nav>

      <div className="screen-line-top mx-3 mt-2" />

      <ScrollArea className="flex-1 px-3 py-2">
        {failed ? (
          <p className="px-2 py-4 text-xs text-muted-foreground">
            couldn&apos;t load playlists
          </p>
        ) : (
          <PlaylistNav playlists={playlists} />
        )}
      </ScrollArea>
    </aside>
  );
}
