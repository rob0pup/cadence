import Link from "next/link";

import { CoverArt } from "@/components/cover-art";
import type { GroupSummary } from "@/lib/queries";

export function BrowseGrid({
  items,
  hrefBase,
}: {
  items: GroupSummary[];
  hrefBase: string;
}) {
  if (items.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center py-24 text-sm text-muted-foreground">
        nothing here yet
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
      {items.map((item) => (
        <Link
          key={item.name}
          href={`${hrefBase}/${encodeURIComponent(item.name)}`}
          className="group flex flex-col gap-2 rounded-xl p-3 ring-1 ring-foreground/10 transition-colors hover:bg-muted/50 dark:ring-border"
        >
          <CoverArt
            url={item.coverUrl}
            name={item.name}
            sizes="200px"
            className="aspect-square w-full rounded-lg text-2xl"
          />
          <div className="min-w-0">
            <div className="truncate text-sm font-medium">{item.name}</div>
            <div className="truncate text-xs text-muted-foreground">
              {item.subtitle} · {item.count} track{item.count === 1 ? "" : "s"}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
