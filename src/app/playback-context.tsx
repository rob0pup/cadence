"use client";

import * as React from "react";

import type { RepeatMode, Song } from "@/lib/types";

type PlaybackContextType = {
  currentTrack: Song | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  shuffle: boolean;
  repeat: RepeatMode;
  queue: Song[];
  audioRef: React.RefObject<HTMLAudioElement | null>;
  playTrack: (track: Song, queue?: Song[]) => void;
  togglePlayPause: () => void;
  playNextTrack: () => void;
  playPreviousTrack: () => void;
  seek: (time: number) => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  patchCurrentTrack: (patch: Partial<Song>) => void;
  queueOpen: boolean;
  toggleQueue: () => void;
};

const PlaybackContext = React.createContext<PlaybackContextType | undefined>(
  undefined,
);

const STORAGE_KEY = "cadence:playback";

type PersistedState = {
  volume: number;
  isMuted: boolean;
  shuffle: boolean;
  repeat: RepeatMode;
  track: Song | null;
  position: number;
};

function readPersisted(): Partial<PersistedState> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Resolve the local-file rewrite: file:// urls are streamed via the api route. */
export function getAudioSrc(url: string): string {
  if (url.startsWith("file://")) {
    const filename = url.split("/").pop();
    return `/api/audio/${encodeURIComponent(filename ?? "")}`;
  }
  return url;
}

export function PlaybackProvider({ children }: { children: React.ReactNode }) {
  const audioRef = React.useRef<HTMLAudioElement>(null);

  const [currentTrack, setCurrentTrack] = React.useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [volume, setVolumeState] = React.useState(1);
  const [isMuted, setIsMuted] = React.useState(false);
  const [shuffle, setShuffle] = React.useState(false);
  const [repeat, setRepeat] = React.useState<RepeatMode>("off");
  const [baseQueue, setBaseQueue] = React.useState<Song[]>([]);
  const [queue, setQueue] = React.useState<Song[]>([]);
  const [queueOpen, setQueueOpen] = React.useState(false);
  const toggleQueue = React.useCallback(() => setQueueOpen((o) => !o), []);

  // Restore persisted settings + last track (paused) on mount.
  React.useEffect(() => {
    const p = readPersisted();
    if (typeof p.volume === "number") setVolumeState(p.volume);
    if (typeof p.isMuted === "boolean") setIsMuted(p.isMuted);
    if (typeof p.shuffle === "boolean") setShuffle(p.shuffle);
    if (p.repeat) setRepeat(p.repeat);
    if (p.track) {
      setCurrentTrack(p.track);
      setBaseQueue([p.track]);
      setQueue([p.track]);
      if (audioRef.current) {
        audioRef.current.src = getAudioSrc(p.track.audioUrl);
        if (typeof p.position === "number") {
          audioRef.current.currentTime = p.position;
          setCurrentTime(p.position);
        }
      }
    }
  }, []);

  const persist = React.useCallback(
    (patch: Partial<PersistedState>) => {
      if (typeof window === "undefined") return;
      const next: PersistedState = {
        volume,
        isMuted,
        shuffle,
        repeat,
        track: currentTrack,
        position: currentTime,
        ...patch,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    },
    [volume, isMuted, shuffle, repeat, currentTrack, currentTime],
  );

  // Apply volume/mute to the element.
  React.useEffect(() => {
    if (audioRef.current) audioRef.current.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  const playTrack = React.useCallback(
    (track: Song, songs?: Song[]) => {
      if (songs) {
        setBaseQueue(songs);
        setQueue(shuffle ? shuffleArray(songs) : songs);
      }
      setCurrentTrack(track);
      setCurrentTime(0);
      setIsPlaying(true);
      if (audioRef.current) {
        audioRef.current.src = getAudioSrc(track.audioUrl);
        void audioRef.current.play();
      }
      persist({ track, position: 0 });
    },
    [shuffle, persist],
  );

  const togglePlayPause = React.useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      void audio.play();
      setIsPlaying(true);
    }
  }, [isPlaying, currentTrack]);

  const playNextTrack = React.useCallback(() => {
    if (!currentTrack || queue.length === 0) return;
    const idx = queue.findIndex((t) => t.id === currentTrack.id);
    if (idx === -1) return;
    const isLast = idx === queue.length - 1;
    if (isLast && repeat === "off") return;
    const nextIdx = isLast ? 0 : idx + 1;
    playTrack(queue[nextIdx]);
  }, [currentTrack, queue, repeat, playTrack]);

  const playPreviousTrack = React.useCallback(() => {
    if (!currentTrack || queue.length === 0) return;
    if (currentTime > 3 && audioRef.current) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      return;
    }
    const idx = queue.findIndex((t) => t.id === currentTrack.id);
    if (idx === -1) return;
    const prevIdx = (idx - 1 + queue.length) % queue.length;
    playTrack(queue[prevIdx]);
  }, [currentTrack, queue, currentTime, playTrack]);

  const seek = React.useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  const setVolume = React.useCallback(
    (v: number) => {
      const clamped = Math.max(0, Math.min(1, v));
      setVolumeState(clamped);
      setIsMuted(clamped === 0);
      persist({ volume: clamped, isMuted: clamped === 0 });
    },
    [persist],
  );

  const toggleMute = React.useCallback(() => {
    setIsMuted((m) => {
      persist({ isMuted: !m });
      return !m;
    });
  }, [persist]);

  const toggleShuffle = React.useCallback(() => {
    setShuffle((s) => {
      const next = !s;
      setQueue(next ? shuffleArray(baseQueue) : baseQueue);
      persist({ shuffle: next });
      return next;
    });
  }, [baseQueue, persist]);

  const cycleRepeat = React.useCallback(() => {
    setRepeat((r) => {
      const next: RepeatMode = r === "off" ? "all" : r === "all" ? "one" : "off";
      persist({ repeat: next });
      return next;
    });
  }, [persist]);

  const patchCurrentTrack = React.useCallback((patch: Partial<Song>) => {
    setCurrentTrack((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  // Wire the audio element events.
  React.useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTime = () => setCurrentTime(audio.currentTime);
    const onDuration = () => setDuration(audio.duration);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => {
      if (repeat === "one") {
        audio.currentTime = 0;
        void audio.play();
        return;
      }
      playNextTrack();
    };

    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onDuration);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onDuration);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
    };
  }, [repeat, playNextTrack]);

  // Persist the play position periodically so we can resume on reload.
  React.useEffect(() => {
    if (!currentTrack) return;
    const id = window.setInterval(() => {
      if (isPlaying) persist({ position: audioRef.current?.currentTime ?? 0 });
    }, 5000);
    return () => window.clearInterval(id);
  }, [currentTrack, isPlaying, persist]);

  // Global shortcuts: space = play/pause, "/" = focus search.
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing =
        !!target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);
      if (e.key === " " && !typing) {
        e.preventDefault();
        togglePlayPause();
      } else if (e.key === "/" && !typing) {
        e.preventDefault();
        (
          document.querySelector(
            'input[type="search"]',
          ) as HTMLInputElement | null
        )?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [togglePlayPause]);

  const value: PlaybackContextType = {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    shuffle,
    repeat,
    queue,
    audioRef,
    playTrack,
    togglePlayPause,
    playNextTrack,
    playPreviousTrack,
    seek,
    setVolume,
    toggleMute,
    toggleShuffle,
    cycleRepeat,
    patchCurrentTrack,
    queueOpen,
    toggleQueue,
  };

  return (
    <PlaybackContext.Provider value={value}>
      {children}
    </PlaybackContext.Provider>
  );
}

export function usePlayback() {
  const ctx = React.useContext(PlaybackContext);
  if (ctx === undefined) {
    throw new Error("usePlayback must be used within a PlaybackProvider");
  }
  return ctx;
}
