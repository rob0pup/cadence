"use client";

import {
  Heart,
  ListMusic,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume1,
  Volume2,
  VolumeX,
} from "lucide-react";
import * as React from "react";

import { toggleLikeAction } from "@/app/actions";
import { usePlayback } from "@/app/playback-context";
import { CoverArt } from "@/components/cover-art";
import { Button } from "@/components/ui/button";
import { cn, formatDuration } from "@/lib/utils";

function Scrubber({
  value,
  max,
  onChange,
  ariaLabel,
  className,
}: {
  value: number;
  max: number;
  onChange: (v: number) => void;
  ariaLabel: string;
  className?: string;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = React.useState(false);

  const pctFromEvent = React.useCallback((clientX: number) => {
    const el = ref.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  }, []);

  React.useEffect(() => {
    if (!dragging) return;
    const move = (e: MouseEvent) => onChange(pctFromEvent(e.clientX) * max);
    const up = () => setDragging(false);
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
  }, [dragging, max, onChange, pctFromEvent]);

  const pct = max > 0 ? (value / max) * 100 : 0;

  return (
    <div
      ref={ref}
      role="slider"
      aria-label={ariaLabel}
      aria-valuenow={Math.round(value)}
      aria-valuemax={Math.round(max)}
      tabIndex={0}
      className={cn(
        "group/scrub relative h-1 cursor-pointer rounded-full bg-muted",
        className,
      )}
      onMouseDown={(e) => {
        setDragging(true);
        onChange(pctFromEvent(e.clientX) * max);
      }}
    >
      <div
        className="absolute inset-y-0 left-0 rounded-full bg-foreground"
        style={{ width: `${pct}%` }}
      />
      <div
        className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground opacity-0 transition-opacity group-hover/scrub:opacity-100"
        style={{ left: `${pct}%` }}
      />
    </div>
  );
}

export function PlaybackControls() {
  const {
    audioRef,
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    shuffle,
    repeat,
    togglePlayPause,
    playNextTrack,
    playPreviousTrack,
    seek,
    setVolume,
    toggleMute,
    toggleShuffle,
    cycleRepeat,
    queueOpen,
    toggleQueue,
  } = usePlayback();

  const [likedIds, setLikedIds] = React.useState<Set<string>>(new Set());
  React.useEffect(() => {
    fetch("/api/liked")
      .then((r) => r.json())
      .then((ids: string[]) => setLikedIds(new Set(ids)))
      .catch(() => {});
  }, []);
  const isLiked = !!currentTrack && likedIds.has(currentTrack.id);
  function onToggleLike() {
    if (!currentTrack) return;
    const id = currentTrack.id;
    setLikedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    void toggleLikeAction(id);
  }

  // MediaSession: OS media keys, lock screen, bluetooth controls.
  React.useEffect(() => {
    if (!("mediaSession" in navigator) || !currentTrack) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentTrack.name,
      artist: currentTrack.artist,
      album: currentTrack.album ?? undefined,
      artwork: currentTrack.imageUrl
        ? [{ src: currentTrack.imageUrl, sizes: "512x512" }]
        : undefined,
    });
    navigator.mediaSession.setActionHandler("play", () => togglePlayPause());
    navigator.mediaSession.setActionHandler("pause", () => togglePlayPause());
    navigator.mediaSession.setActionHandler("previoustrack", playPreviousTrack);
    navigator.mediaSession.setActionHandler("nexttrack", playNextTrack);
    navigator.mediaSession.setActionHandler("seekto", (d) => {
      if (d.seekTime != null) seek(d.seekTime);
    });
    return () => {
      navigator.mediaSession.setActionHandler("play", null);
      navigator.mediaSession.setActionHandler("pause", null);
      navigator.mediaSession.setActionHandler("previoustrack", null);
      navigator.mediaSession.setActionHandler("nexttrack", null);
      navigator.mediaSession.setActionHandler("seekto", null);
    };
  }, [
    currentTrack,
    togglePlayPause,
    playPreviousTrack,
    playNextTrack,
    seek,
  ]);

  const VolumeIcon = isMuted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  return (
    <footer className="screen-line-top flex h-20 items-center gap-4 bg-sidebar px-4">
      {/* audio element lives here, in the persistent layout, so it never
          unmounts across navigation and playback continues */}
      <audio ref={audioRef} />

      <div className="flex w-1/4 min-w-0 items-center gap-3">
        {currentTrack && (
          <>
            <CoverArt
              url={currentTrack.imageUrl}
              name={currentTrack.name}
              sizes="44px"
              className="size-11 shrink-0"
            />
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">
                {currentTrack.name}
              </div>
              <div className="truncate text-xs text-muted-foreground">
                {currentTrack.artist}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label={isLiked ? "unlike" : "like"}
              onClick={onToggleLike}
            >
              <Heart
                className={cn("size-3.5", isLiked && "fill-link text-link")}
              />
            </Button>
          </>
        )}
      </div>

      <div className="flex flex-1 flex-col items-center gap-1.5">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="shuffle"
            aria-pressed={shuffle}
            onClick={toggleShuffle}
            className={cn(shuffle && "text-link")}
          >
            <Shuffle className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="previous"
            onClick={playPreviousTrack}
            disabled={!currentTrack}
          >
            <SkipBack className="size-4 fill-current" />
          </Button>
          <Button
            size="icon"
            aria-label={isPlaying ? "pause" : "play"}
            onClick={togglePlayPause}
            disabled={!currentTrack}
            className="rounded-full"
          >
            {isPlaying ? (
              <Pause className="size-4 fill-current" />
            ) : (
              <Play className="size-4 fill-current" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="next"
            onClick={playNextTrack}
            disabled={!currentTrack}
          >
            <SkipForward className="size-4 fill-current" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`repeat: ${repeat}`}
            aria-pressed={repeat !== "off"}
            onClick={cycleRepeat}
            className={cn(repeat !== "off" && "text-link")}
          >
            {repeat === "one" ? (
              <Repeat1 className="size-4" />
            ) : (
              <Repeat className="size-4" />
            )}
          </Button>
        </div>
        <div className="flex w-full max-w-xl items-center gap-2">
          <span className="w-10 text-right text-xs tabular-nums text-muted-foreground">
            {formatDuration(currentTime)}
          </span>
          <Scrubber
            className="flex-1"
            value={currentTime}
            max={duration || 0}
            onChange={seek}
            ariaLabel="seek"
          />
          <span className="w-10 text-xs tabular-nums text-muted-foreground">
            {formatDuration(duration)}
          </span>
        </div>
      </div>

      <div className="flex w-1/4 items-center justify-end gap-2">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="queue"
          aria-pressed={queueOpen}
          onClick={toggleQueue}
          className={cn(queueOpen && "text-link")}
        >
          <ListMusic className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={isMuted ? "unmute" : "mute"}
          onClick={toggleMute}
        >
          <VolumeIcon className="size-4" />
        </Button>
        <Scrubber
          className="w-24"
          value={isMuted ? 0 : volume}
          max={1}
          onChange={setVolume}
          ariaLabel="volume"
        />
      </div>
    </footer>
  );
}
