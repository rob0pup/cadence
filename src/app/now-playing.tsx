"use client";

import * as React from "react";

import { updateTrackAction } from "@/app/actions";
import { usePlayback } from "@/app/playback-context";
import { CoverArt } from "@/components/cover-art";
import { Visualizer } from "@/components/visualizer";
import type { Song } from "@/lib/types";
import { cn } from "@/lib/utils";

type EditableField = "name" | "artist" | "album" | "genre" | "bpm" | "key";

function Field({
  trackId,
  field,
  label,
  value,
  onSaved,
}: {
  trackId: string;
  field: EditableField;
  label: string;
  value: string;
  onSaved: (patch: Partial<Song>) => void;
}) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(value);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => setDraft(value), [value]);
  React.useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  async function save() {
    setEditing(false);
    const trimmed = draft.trim();
    if (trimmed === value) return;
    if (field === "bpm") {
      const n = Number.parseInt(trimmed, 10);
      if (Number.isNaN(n)) return;
      onSaved({ bpm: n });
      await updateTrackAction(trackId, { bpm: n });
    } else {
      onSaved({ [field]: trimmed } as Partial<Song>);
      await updateTrackAction(trackId, { [field]: trimmed });
    }
  }

  return (
    <div className="flex flex-col gap-0.5 border-b border-line/60 py-1.5">
      <span className="text-[0.7rem] text-muted-foreground">{label}</span>
      {editing ? (
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
            if (e.key === "Escape") {
              setDraft(value);
              setEditing(false);
            }
          }}
          inputMode={field === "bpm" ? "numeric" : "text"}
          className="w-full bg-transparent text-sm outline-none"
        />
      ) : (
        <button
          onClick={() => setEditing(true)}
          className="truncate text-left text-sm hover:text-link"
        >
          {value || <span className="text-muted-foreground">-</span>}
        </button>
      )}
    </div>
  );
}

export function NowPlaying() {
  const { currentTrack, patchCurrentTrack, isPlaying } = usePlayback();

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-l bg-sidebar lg:flex">
      <div className="px-4 py-3 text-sm font-medium text-muted-foreground">
        now playing
      </div>
      {currentTrack ? (
        <div className="flex flex-col gap-3 px-4">
          <CoverArt
            url={currentTrack.imageUrl}
            name={currentTrack.name}
            sizes="256px"
            className="aspect-square w-full rounded-lg text-3xl ring-1 ring-foreground/10 dark:ring-border"
          />
          <Visualizer active={isPlaying} />
          <div className="flex flex-col">
            <Field
              trackId={currentTrack.id}
              field="name"
              label="title"
              value={currentTrack.name}
              onSaved={patchCurrentTrack}
            />
            <Field
              trackId={currentTrack.id}
              field="artist"
              label="artist"
              value={currentTrack.artist}
              onSaved={patchCurrentTrack}
            />
            <Field
              trackId={currentTrack.id}
              field="album"
              label="album"
              value={currentTrack.album ?? ""}
              onSaved={patchCurrentTrack}
            />
            <Field
              trackId={currentTrack.id}
              field="genre"
              label="genre"
              value={currentTrack.genre ?? ""}
              onSaved={patchCurrentTrack}
            />
            <div className="grid grid-cols-2 gap-3">
              <Field
                trackId={currentTrack.id}
                field="bpm"
                label="bpm"
                value={currentTrack.bpm?.toString() ?? ""}
                onSaved={patchCurrentTrack}
              />
              <Field
                trackId={currentTrack.id}
                field="key"
                label="key"
                value={currentTrack.key ?? ""}
                onSaved={patchCurrentTrack}
              />
            </div>
          </div>
        </div>
      ) : (
        <div
          className={cn(
            "flex flex-1 items-center justify-center px-6 text-center text-sm text-muted-foreground",
          )}
        >
          nothing playing yet
        </div>
      )}
    </aside>
  );
}
