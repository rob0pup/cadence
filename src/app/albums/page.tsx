import { Suspense } from "react";

import { BrowseGrid } from "@/components/browse-grid";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getAlbums } from "@/lib/queries";
import { getViewerId } from "@/lib/session";

export const dynamic = "force-dynamic";

async function Albums() {
  const albums = await getAlbums(await getViewerId());
  return <BrowseGrid items={albums} hrefBase="/album" />;
}

export default function AlbumsPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="screen-line-bottom flex h-14 items-center px-6">
        <h1 className="text-lg font-medium tracking-tight">Albums</h1>
      </header>
      <ScrollArea className="min-h-0 flex-1">
        <Suspense
          fallback={
            <div className="p-6 text-sm text-muted-foreground">loading…</div>
          }
        >
          <Albums />
        </Suspense>
      </ScrollArea>
    </div>
  );
}
