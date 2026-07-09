import { Suspense } from "react";

import { BrowseGrid } from "@/components/browse-grid";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getArtists } from "@/lib/queries";

export const dynamic = "force-dynamic";

async function Artists() {
  const artists = await getArtists();
  return <BrowseGrid items={artists} hrefBase="/artist" />;
}

export default function ArtistsPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="screen-line-bottom flex h-14 items-center px-6">
        <h1 className="text-lg font-medium tracking-tight">artists</h1>
      </header>
      <ScrollArea className="min-h-0 flex-1">
        <Suspense
          fallback={
            <div className="p-6 text-sm text-muted-foreground">loading…</div>
          }
        >
          <Artists />
        </Suspense>
      </ScrollArea>
    </div>
  );
}
