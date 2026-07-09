import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <div>
        <h2 className="text-lg font-medium tracking-tight">not found</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          that page or playlist doesn&apos;t exist.
        </p>
      </div>
      <Button asChild variant="outline">
        <Link href="/">back to all tracks</Link>
      </Button>
    </div>
  );
}
