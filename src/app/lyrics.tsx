"use client";

import * as React from "react";

import type { Song } from "@/lib/types";

type LrcHit = { plainLyrics?: string | null };

export function Lyrics({ track }: { track: Song }) {
  const [state, setState] = React.useState<"loading" | "none" | "ok">(
    "loading",
  );
  const [lyrics, setLyrics] = React.useState("");

  React.useEffect(() => {
    let cancelled = false;
    setState("loading");
    setLyrics("");

    const params = new URLSearchParams({
      track_name: track.name,
      artist_name: track.artist,
    });
    if (track.album) params.set("album_name", track.album);

    // lrclib is a free, no-key lyrics database with permissive CORS
    fetch(`https://lrclib.net/api/search?${params.toString()}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((rows: LrcHit[]) => {
        if (cancelled) return;
        const hit = Array.isArray(rows)
          ? rows.find((r) => r.plainLyrics)
          : null;
        if (hit?.plainLyrics) {
          setLyrics(hit.plainLyrics);
          setState("ok");
        } else {
          setState("none");
        }
      })
      .catch(() => {
        if (!cancelled) setState("none");
      });

    return () => {
      cancelled = true;
    };
  }, [track.id, track.name, track.artist, track.album]);

  if (state === "loading") {
    return (
      <p className="py-4 text-sm text-muted-foreground">Searching for lyrics…</p>
    );
  }
  if (state === "none") {
    return <p className="py-4 text-sm text-muted-foreground">No lyrics found.</p>;
  }
  return (
    <pre className="py-1 font-sans text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">
      {lyrics}
    </pre>
  );
}
