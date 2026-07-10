"use client";

import { RotateCw } from "lucide-react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <div>
        <h2 className="text-lg font-medium tracking-tight">
          This section couldn&apos;t load
        </h2>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Something went wrong reaching the library. Your playback keeps running,
          try again in a moment.
        </p>
        {error.digest ? (
          <p className="mt-2 font-mono text-xs text-muted-foreground/70">
            {error.digest}
          </p>
        ) : null}
      </div>
      <Button variant="outline" onClick={reset}>
        <RotateCw className="size-4" />
        Try again
      </Button>
    </div>
  );
}
