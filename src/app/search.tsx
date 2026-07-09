"use client";

import { X } from "lucide-react";
import { useQueryState } from "nuqs";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SearchInput() {
  const [q, setQ] = useQueryState("q", {
    shallow: false,
    defaultValue: "",
    clearOnDefault: true,
  });
  const [value, setValue] = React.useState(q);

  // Debounce URL updates; only navigate when the value actually changes, so
  // loading the page never triggers a redundant navigation.
  React.useEffect(() => {
    if (value === q) return;
    const t = setTimeout(() => setQ(value || null), 250);
    return () => clearTimeout(t);
  }, [value, q, setQ]);

  return (
    <div className="relative">
      <Input
        type="search"
        placeholder="search"
        value={value}
        onChange={(e) => setValue(e.currentTarget.value)}
        className="h-8 pr-8 text-xs [&::-webkit-search-cancel-button]:appearance-none"
      />
      {value ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label="clear search"
          className="absolute top-1/2 right-1 -translate-y-1/2"
          onClick={() => setValue("")}
        >
          <X className="size-3.5" />
        </Button>
      ) : (
        <kbd className="pointer-events-none absolute top-1/2 right-2 flex size-5 -translate-y-1/2 items-center justify-center rounded border bg-muted font-mono text-xs text-muted-foreground">
          /
        </kbd>
      )}
    </div>
  );
}
