"use client";

import * as React from "react";

import { usePlayback } from "@/app/playback-context";
import type { Song } from "@/lib/types";
import { cn } from "@/lib/utils";

type Line = { time: number; text: string };
type LrcHit = { plainLyrics?: string | null; syncedLyrics?: string | null };

/** Parse LRC (`[mm:ss.xx] text`) into timed lines. */
function parseLrc(lrc: string): Line[] {
  const out: Line[] = [];
  for (const raw of lrc.split("\n")) {
    const m = raw.match(/^\s*\[(\d+):(\d{2}(?:\.\d+)?)\]\s*(.*)$/);
    if (!m) continue;
    out.push({
      time: parseInt(m[1], 10) * 60 + parseFloat(m[2]),
      text: m[3].trim(),
    });
  }
  return out;
}

export function Lyrics({ track }: { track: Song }) {
  const { currentTime, seek } = usePlayback();
  const [state, setState] = React.useState<
    "loading" | "none" | "synced" | "plain"
  >("loading");
  const [lines, setLines] = React.useState<Line[]>([]);
  const [plain, setPlain] = React.useState("");
  const activeRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    let cancelled = false;
    setState("loading");
    setLines([]);
    setPlain("");

    const params = new URLSearchParams({
      track_name: track.name,
      artist_name: track.artist,
    });
    if (track.album) params.set("album_name", track.album);

    fetch(`https://lrclib.net/api/search?${params.toString()}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((rows: LrcHit[]) => {
        if (cancelled) return;
        const list = Array.isArray(rows) ? rows : [];
        const synced = list.find((r) => r.syncedLyrics)?.syncedLyrics;
        if (synced) {
          const parsed = parseLrc(synced);
          if (parsed.length) {
            setLines(parsed);
            setState("synced");
            return;
          }
        }
        const plainHit = list.find((r) => r.plainLyrics)?.plainLyrics;
        if (plainHit) {
          setPlain(plainHit);
          setState("plain");
          return;
        }
        setState("none");
      })
      .catch(() => {
        if (!cancelled) setState("none");
      });

    return () => {
      cancelled = true;
    };
  }, [track.id, track.name, track.artist, track.album]);

  const activeIndex = React.useMemo(() => {
    if (state !== "synced") return -1;
    let idx = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].time <= currentTime + 0.2) idx = i;
      else break;
    }
    return idx;
  }, [state, lines, currentTime]);

  React.useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [activeIndex]);

  if (state === "loading") {
    return (
      <p className="py-4 text-sm text-muted-foreground">Searching for lyrics…</p>
    );
  }
  if (state === "none") {
    return <p className="py-4 text-sm text-muted-foreground">No lyrics found.</p>;
  }
  if (state === "plain") {
    return (
      <pre className="py-1 font-sans text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">
        {plain}
      </pre>
    );
  }
  return (
    <div className="flex flex-col gap-1.5 py-1 text-sm">
      {lines.map((ln, i) => (
        <button
          key={i}
          ref={i === activeIndex ? activeRef : undefined}
          onClick={() => seek(ln.time)}
          className={cn(
            "text-left leading-snug transition-colors",
            i === activeIndex
              ? "font-medium text-foreground"
              : "text-muted-foreground hover:text-foreground/80",
          )}
        >
          {ln.text || "♪"}
        </button>
      ))}
    </div>
  );
}
