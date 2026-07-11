import { Clock, Disc3, Heart, Mic2, Music2 } from "lucide-react";
import Link from "next/link";

import { PlaylistNav } from "@/app/playlist-nav";
import { SearchInput } from "@/app/search";
import { LogoMark } from "@/components/logo-mark";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "@/components/user-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getAllPlaylists } from "@/lib/queries";
import type { Playlist } from "@/lib/types";

const NAV = [
  { href: "/", label: "All Tracks", icon: Music2 },
  { href: "/liked", label: "Liked Songs", icon: Heart },
  { href: "/recent", label: "Recently Played", icon: Clock },
  { href: "/albums", label: "Albums", icon: Disc3 },
  { href: "/artists", label: "Artists", icon: Mic2 },
];

/** The sidebar contents, reused by both the desktop rail and the mobile drawer. */
export async function SidebarInner() {
  let playlists: Playlist[] = [];
  let failed = false;
  try {
    playlists = await getAllPlaylists();
  } catch {
    // keep the shell alive if the database is unreachable
    failed = true;
  }

  return (
    <div className="flex h-full flex-col bg-sidebar">
      <div className="flex items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-mono font-medium">
          <LogoMark className="h-4 w-[1.1rem]" />
          Cadence
        </Link>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <UserMenu />
        </div>
      </div>

      <div className="px-3 pb-2">
        <SearchInput />
      </div>

      <nav className="flex flex-col px-3">
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Icon className="size-3.5" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="screen-line-top mx-3 mt-2" />

      <ScrollArea className="flex-1 px-3 py-2">
        {failed ? (
          <p className="px-2 py-4 text-xs text-muted-foreground">
            Couldn&apos;t load playlists
          </p>
        ) : (
          <PlaylistNav playlists={playlists} />
        )}
      </ScrollArea>
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="hidden w-60 shrink-0 border-r md:block">
      <SidebarInner />
    </aside>
  );
}
