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
  playAll: (songs: Song[], shuffled?: boolean) => void;
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
  sleepUntil: number | null;
  setSleepTimer: (minutes: number | null) => void;
  playNext: (song: Song) => void;
  addToQueue: (song: Song) => void;
  removeFromQueue: (songId: string) => void;
  radioOn: boolean;
  toggleRadio: () => void;
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
  radioOn: boolean;
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
  const [radioOn, setRadioOn] = React.useState(false);
  const toggleRadio = React.useCallback(() => setRadioOn((o) => !o), []);
  const [queueOpen, setQueueOpen] = React.useState(false);
  const toggleQueue = React.useCallback(() => setQueueOpen((o) => !o), []);
  const [sleepUntil, setSleepUntil] = React.useState<number | null>(null);
  const sleepTimeoutRef = React.useRef<number | null>(null);

  const setSleepTimer = React.useCallback((minutes: number | null) => {
    if (sleepTimeoutRef.current) window.clearTimeout(sleepTimeoutRef.current);
    if (minutes == null) {
      setSleepUntil(null);
      sleepTimeoutRef.current = null;
      return;
    }
    const ms = minutes * 60_000;
    setSleepUntil(Date.now() + ms);
    sleepTimeoutRef.current = window.setTimeout(() => {
      audioRef.current?.pause();
      setIsPlaying(false);
      setSleepUntil(null);
      sleepTimeoutRef.current = null;
    }, ms);
  }, []);

  // Restore persisted settings + last track (paused) on mount.
  React.useEffect(() => {
    const p = readPersisted();
    if (typeof p.volume === "number") setVolumeState(p.volume);
    if (typeof p.isMuted === "boolean") setIsMuted(p.isMuted);
    if (typeof p.shuffle === "boolean") setShuffle(p.shuffle);
    if (p.repeat) setRepeat(p.repeat);
    if (typeof p.radioOn === "boolean") setRadioOn(p.radioOn);
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
        radioOn,
        track: currentTrack,
        position: currentTime,
        ...patch,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    },
    [volume, isMuted, shuffle, repeat, radioOn, currentTrack, currentTime],
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

  const playAll = React.useCallback(
    (songs: Song[], shuffled = false) => {
      if (songs.length === 0) return;
      const order = shuffled ? shuffleArray(songs) : songs;
      setShuffle(shuffled);
      setBaseQueue(songs);
      setQueue(order);
      const first = order[0];
      setCurrentTrack(first);
      setCurrentTime(0);
      setIsPlaying(true);
      if (audioRef.current) {
        audioRef.current.src = getAudioSrc(first.audioUrl);
        void audioRef.current.play();
      }
      persist({ track: first, position: 0, shuffle: shuffled });
    },
    [persist],
  );

  const playNext = React.useCallback(
    (song: Song) => {
      if (!currentTrack) {
        playTrack(song, [song]);
        return;
      }
      const insert = (q: Song[]) => {
        const filtered = q.filter((s) => s.id !== song.id);
        const idx = filtered.findIndex((s) => s.id === currentTrack.id);
        filtered.splice(idx + 1, 0, song);
        return filtered;
      };
      setBaseQueue(insert);
      setQueue(insert);
    },
    [currentTrack, playTrack],
  );

  const addToQueue = React.useCallback(
    (song: Song) => {
      if (!currentTrack) {
        playTrack(song, [song]);
        return;
      }
      const append = (q: Song[]) => [
        ...q.filter((s) => s.id !== song.id),
        song,
      ];
      setBaseQueue(append);
      setQueue(append);
    },
    [currentTrack, playTrack],
  );

  const removeFromQueue = React.useCallback((songId: string) => {
    const remove = (q: Song[]) => q.filter((s) => s.id !== songId);
    setBaseQueue(remove);
    setQueue(remove);
  }, []);

  // radio: when the queue runs out, pull in related tracks and keep playing
  const extendRadio = React.useCallback(
    async (seedId: string) => {
      try {
        const res = await fetch(`/api/radio?seed=${seedId}`);
        const related: Song[] = await res.json();
        const inQueue = new Set(queue.map((s) => s.id));
        const fresh = related.filter((s) => !inQueue.has(s.id));
        if (fresh.length === 0) return;
        setBaseQueue((q) => [...q, ...fresh]);
        setQueue((q) => [...q, ...fresh]);
        playTrack(fresh[0]);
      } catch {
        // radio is best-effort
      }
    },
    [queue, playTrack],
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
      const idx = queue.findIndex((t) => t.id === currentTrack?.id);
      if (radioOn && repeat === "off" && currentTrack && idx === queue.length - 1) {
        void extendRadio(currentTrack.id);
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
  }, [repeat, playNextTrack, queue, currentTrack, radioOn, extendRadio]);

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
    playAll,
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
    sleepUntil,
    setSleepTimer,
    playNext,
    addToQueue,
    removeFromQueue,
    radioOn,
    toggleRadio,
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
