"use client";

import { Globe, Link2, Lock, Share2 } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { setPlaylistPublicAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export function SharePlaylist({
  id,
  isPublic: initial,
}: {
  id: string;
  isPublic: boolean;
}) {
  const router = useRouter();
  const [isPublic, setIsPublic] = React.useState(initial);
  const [, startTransition] = React.useTransition();

  React.useEffect(() => setIsPublic(initial), [initial]);

  function copyLink() {
    navigator.clipboard.writeText(`${window.location.origin}/p/${id}`);
    toast.success("Link copied");
  }

  function setPublic(next: boolean, thenCopy = false) {
    setIsPublic(next);
    startTransition(async () => {
      await setPlaylistPublicAction(id, next);
      if (thenCopy) copyLink();
      else toast(next ? "Playlist is public" : "Playlist is private");
      router.refresh();
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={isPublic ? "secondary" : "outline"}
          size="sm"
          className={cn(isPublic && "text-link")}
        >
          <Share2 className="size-4" />
          {isPublic ? "Shared" : "Share"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {isPublic ? (
          <>
            <DropdownMenuItem onSelect={copyLink}>
              <Link2 className="size-3.5" />
              Copy link
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setPublic(false)}>
              <Lock className="size-3.5" />
              Make private
            </DropdownMenuItem>
          </>
        ) : (
          <DropdownMenuItem onSelect={() => setPublic(true, true)}>
            <Globe className="size-3.5" />
            Make public and copy link
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
