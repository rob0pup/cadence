"use client";

import { Link2, Loader2, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { importFromUrlAction, uploadTracksAction } from "@/app/actions";
import { useAuth } from "@/app/hooks/use-auth";
import { detectBpm } from "@/lib/bpm";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

export function UploadButton() {
  const router = useRouter();
  const { ensureSignedIn } = useAuth();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [pending, setPending] = React.useState(false);
  const [urlOpen, setUrlOpen] = React.useState(false);
  const [url, setUrl] = React.useState("");

  async function onFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    if (!ensureSignedIn()) return;
    setPending(true);
    try {
      const list = Array.from(files);
      const bpms = await Promise.all(list.map(detectBpm));
      const fd = new FormData();
      list.forEach((f) => fd.append("files", f));
      fd.append("bpms", JSON.stringify(bpms));
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

  async function onImportUrl() {
    if (!url.trim()) return;
    if (!ensureSignedIn()) return;
    setPending(true);
    try {
      const res = await importFromUrlAction(url);
      if (res.ok) {
        toast.success(res.message);
        setUrl("");
        setUrlOpen(false);
        router.refresh();
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("Import failed");
    } finally {
      setPending(false);
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

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={pending}>
            {pending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Upload className="size-4" />
            )}
            Import
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => inputRef.current?.click()}>
            <Upload className="size-3.5" />
            Upload files
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setTimeout(() => setUrlOpen(true), 0)}>
            <Link2 className="size-3.5" />
            From a link
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={urlOpen} onOpenChange={setUrlOpen}>
        <DialogContent className="p-5">
          <DialogTitle>Import from a link</DialogTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Paste a direct audio link, or a public Google Drive or Dropbox
            share link.
          </p>
          <div className="mt-3 flex gap-2">
            <Input
              autoFocus
              type="url"
              placeholder="https://example.com/song.mp3"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onImportUrl();
              }}
            />
            <Button onClick={onImportUrl} disabled={pending || !url.trim()}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : "Import"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
