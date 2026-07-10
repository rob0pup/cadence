"use client";

import { ListMusic, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import * as React from "react";

import { createPlaylistAction, deletePlaylistAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import type { Playlist } from "@/lib/types";
import { cn } from "@/lib/utils";

export function PlaylistNav({ playlists }: { playlists: Playlist[] }) {
  const pathname = usePathname();
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [optimistic, setOptimistic] = React.useOptimistic(
    playlists,
    (state: Playlist[], removedId: string) =>
      state.filter((p) => p.id !== removedId),
  );

  function onCreate() {
    startTransition(async () => {
      const playlist = await createPlaylistAction();
      router.push(`/p/${playlist.id}`);
      router.refresh();
    });
  }

  function onDelete(id: string) {
    startTransition(async () => {
      setOptimistic(id);
      if (pathname === `/p/${id}`) router.push("/");
      await deletePlaylistAction(id);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between px-2 py-1.5">
        <span className="text-xs font-medium text-muted-foreground">
          Playlists
        </span>
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label="new playlist"
          onClick={onCreate}
          disabled={pending}
        >
          <Plus className="size-3.5" />
        </Button>
      </div>
      <ul className="flex flex-col">
        {optimistic.map((p) => {
          const active = pathname === `/p/${p.id}`;
          return (
            <li key={p.id} className="group relative">
              <Link
                href={`/p/${p.id}`}
                className={cn(
                  "flex items-center gap-2 truncate rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground",
                  active && "bg-muted text-foreground",
                )}
              >
                <ListMusic className="size-3.5 shrink-0" />
                <span className="truncate">{p.name}</span>
              </Link>
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label="delete playlist"
                className="absolute top-1/2 right-1 -translate-y-1/2 opacity-0 group-hover:opacity-100"
                onClick={() => onDelete(p.id)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
