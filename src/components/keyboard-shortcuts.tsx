"use client";

import * as React from "react";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

const SHORTCUTS: [string, string][] = [
  ["space", "play / pause"],
  ["/", "focus search"],
  ["⌘ / ctrl + k", "command menu"],
  ["?", "this help"],
];

export function KeyboardShortcuts() {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const typing =
        !!t &&
        (t.tagName === "INPUT" ||
          t.tagName === "TEXTAREA" ||
          t.isContentEditable);
      if (e.key === "?" && !typing) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="p-5">
        <DialogTitle>keyboard shortcuts</DialogTitle>
        <div className="mt-3 flex flex-col gap-1">
          {SHORTCUTS.map(([key, label]) => (
            <div
              key={key}
              className="flex items-center justify-between py-1 text-sm"
            >
              <span className="text-muted-foreground">{label}</span>
              <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-xs">
                {key}
              </kbd>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
