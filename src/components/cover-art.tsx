import Image from "next/image";

import { cn } from "@/lib/utils";

export function CoverArt({
  url,
  name,
  sizes = "64px",
  className,
}: {
  url?: string | null;
  name: string;
  sizes?: string;
  className?: string;
}) {
  const hue =
    [...name].reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded bg-muted",
        className,
      )}
    >
      {url ? (
        <Image src={url} alt="" fill sizes={sizes} className="object-cover" />
      ) : (
        <div
          className="grid size-full place-items-center font-mono text-sm font-medium text-white/90"
          style={{
            backgroundImage: `linear-gradient(135deg, oklch(0.62 0.15 ${hue}), oklch(0.45 0.16 ${(hue + 40) % 360}))`,
          }}
        >
          {name.trim()[0]?.toUpperCase() ?? "?"}
        </div>
      )}
    </div>
  );
}
