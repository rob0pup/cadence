"use client";

import { LogIn, LogOut } from "lucide-react";

import { useAuth } from "@/app/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function UserMenu() {
  const { user } = useAuth();

  if (!user) {
    return (
      <Button asChild variant="outline" size="sm">
        <a href="/auth/login">
          <LogIn className="size-4" />
          Sign in
        </a>
      </Button>
    );
  }

  const initial = (user.name ?? user.email ?? "?").trim()[0]?.toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Account"
          className="overflow-hidden rounded-full"
        >
          {user.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.image} alt="" className="size-6 rounded-full" />
          ) : (
            <span className="grid size-6 place-items-center rounded-full bg-muted text-xs">
              {initial}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel className="truncate">
          {user.name ?? user.email}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <a href="/auth/logout">
            <LogOut className="size-3.5" />
            Sign out
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
