"use client";

import { UploadCloud } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { uploadTracksAction } from "@/app/actions";
import { useAuth } from "@/app/hooks/use-auth";

const AUDIO_RE = /\.(mp3|m4a|aac|ogg|wav|flac)$/i;

/** Drop audio files anywhere on the window to import them. */
export function DropImport() {
  const router = useRouter();
  const { ensureSignedIn } = useAuth();
  const [dragging, setDragging] = React.useState(false);
  const depth = React.useRef(0);

  React.useEffect(() => {
    const hasFiles = (e: DragEvent) =>
      Array.from(e.dataTransfer?.types ?? []).includes("Files");

    const onEnter = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      depth.current += 1;
      setDragging(true);
    };
    const onOver = (e: DragEvent) => {
      if (hasFiles(e)) e.preventDefault();
    };
    const onLeave = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      depth.current = Math.max(0, depth.current - 1);
      if (depth.current === 0) setDragging(false);
    };
    const onDrop = async (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      depth.current = 0;
      setDragging(false);

      const files = Array.from(e.dataTransfer?.files ?? []).filter(
        (f) => f.type.startsWith("audio/") || AUDIO_RE.test(f.name),
      );
      if (files.length === 0) {
        toast.error("Drop audio files to import");
        return;
      }
      if (!ensureSignedIn()) return;

      const id = toast.loading(
        `Importing ${files.length} file${files.length === 1 ? "" : "s"}…`,
      );
      try {
        const fd = new FormData();
        files.forEach((f) => fd.append("files", f));
        const res = await uploadTracksAction(fd);
        toast.success(
          `Imported ${res.count} track${res.count === 1 ? "" : "s"}`,
          { id },
        );
        router.refresh();
      } catch {
        toast.error("Import failed", { id });
      }
    };

    window.addEventListener("dragenter", onEnter);
    window.addEventListener("dragover", onOver);
    window.addEventListener("dragleave", onLeave);
    window.addEventListener("drop", onDrop);
    return () => {
      window.removeEventListener("dragenter", onEnter);
      window.removeEventListener("dragover", onOver);
      window.removeEventListener("dragleave", onLeave);
      window.removeEventListener("drop", onDrop);
    };
  }, [ensureSignedIn, router]);

  if (!dragging) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-ring px-10 py-8 text-center">
        <UploadCloud className="size-8 text-muted-foreground" />
        <p className="text-sm font-medium">Drop audio files to import</p>
      </div>
    </div>
  );
}
