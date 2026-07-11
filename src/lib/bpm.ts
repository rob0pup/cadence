import { analyze } from "web-audio-beat-detector";

/**
 * Best-effort client-side BPM detection for an audio file. Returns null if the
 * file can't be decoded or a tempo can't be found. Runs in the browser only.
 */
export async function detectBpm(file: File): Promise<number | null> {
  if (typeof window === "undefined" || typeof AudioContext === "undefined") {
    return null;
  }
  let ctx: AudioContext | null = null;
  try {
    const arrayBuffer = await file.arrayBuffer();
    ctx = new AudioContext();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    const tempo = await analyze(audioBuffer);
    return Math.round(tempo);
  } catch {
    return null;
  } finally {
    void ctx?.close();
  }
}
