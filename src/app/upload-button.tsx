"use client";

import { Loader2, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { uploadTracksAction } from "@/app/actions";
import { Button } from "@/components/ui/button";

export function UploadButton() {
  const router = useRouter();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [pending, setPending] = React.useState(false);

  async function onFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setPending(true);
    try {
      const fd = new FormData();
      Array.from(files).forEach((f) => fd.append("files", f));
      const res = await uploadTracksAction(fd);
      toast.success(`Imported ${res.count} track${res.count === 1 ? "" : "s"}`);
      router.refresh();
    } catch {
      toast.error("Import failed");
    } finally {
      setPending(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="audio/mpeg,.mp3"
        multiple
        hidden
        onChange={(e) => onFiles(e.target.files)}
      />
      <Button
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={() => inputRef.current?.click()}
      >
        {pending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Upload className="size-4" />
        )}
        Import
      </Button>
    </>
  );
}
