import { Suspense } from "react";

import { CoverArt } from "@/components/cover-art";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getListeningStats } from "@/lib/queries";
import { getViewerId } from "@/lib/session";

export const dynamic = "force-dynamic";

function Tile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl px-4 py-5 text-center ring-1 ring-foreground/10 dark:ring-border">
      <div className="text-2xl font-medium tabular-nums">
        {value.toLocaleString()}
      </div>
      <div className="mt-1 text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

async function Stats() {
  const stats = await getListeningStats(await getViewerId());

  if (!stats) {
    return (
      <div className="flex flex-1 items-center justify-center py-24 text-sm text-muted-foreground">
        Sign in to see your listening stats.
      </div>
    );
  }
  if (stats.totalPlays === 0) {
    return (
      <div className="flex flex-1 items-center justify-center py-24 text-sm text-muted-foreground">
        No listening history yet. Play some music and check back.
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      <div className="grid grid-cols-3 gap-3">
        <Tile label="plays" value={stats.totalPlays} />
        <Tile label="tracks" value={stats.uniqueTracks} />
        <Tile label="minutes" value={stats.totalMinutes} />
      </div>

      <section>
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">
          Top tracks
        </h2>
        <ol className="flex flex-col">
          {stats.topTracks.map((t, i) => (
            <li
              key={t.song.id}
              className="flex items-center gap-3 border-b border-line/60 py-2"
            >
              <span className="w-5 text-right text-sm tabular-nums text-muted-foreground">
                {i + 1}
              </span>
              <CoverArt
                url={t.song.imageUrl}
                name={t.song.name}
                sizes="32px"
                className="size-8 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">
                  {t.song.name}
                </div>
                <div className="truncate text-xs text-muted-foreground">
                  {t.song.artist}
                </div>
              </div>
              <span className="text-xs tabular-nums text-muted-foreground">
                {t.count} play{t.count === 1 ? "" : "s"}
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">
          Top artists
        </h2>
        <ol className="flex flex-col">
          {stats.topArtists.map((a, i) => (
            <li
              key={a.name}
              className="flex items-center gap-3 border-b border-line/60 py-2"
            >
              <span className="w-5 text-right text-sm tabular-nums text-muted-foreground">
                {i + 1}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-medium">
                {a.name}
              </span>
              <span className="text-xs tabular-nums text-muted-foreground">
                {a.count} play{a.count === 1 ? "" : "s"}
              </span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

export default function StatsPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="screen-line-bottom flex h-14 items-center px-6">
        <h1 className="text-lg font-medium tracking-tight">Stats</h1>
      </header>
      <ScrollArea className="min-h-0 flex-1">
        <Suspense
          fallback={
            <div className="p-6 text-sm text-muted-foreground">loading…</div>
          }
        >
          <Stats />
        </Suspense>
      </ScrollArea>
    </div>
  );
}
