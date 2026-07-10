"use client";

import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { Dialog as DialogPrimitive } from "radix-ui";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { LogoMark } from "@/components/logo-mark";

export function MobileMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();

  // close the drawer whenever the route changes
  React.useEffect(() => setOpen(false), [pathname]);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <div className="screen-line-bottom flex h-14 items-center gap-2 bg-sidebar px-3 md:hidden">
        <DialogPrimitive.Trigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label="open menu">
            <Menu className="size-4" />
          </Button>
        </DialogPrimitive.Trigger>
        <div className="flex items-center gap-2 font-mono text-sm font-medium">
          <LogoMark className="h-4 w-[1.1rem]" />
          Cadence
        </div>
      </div>

      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-closed:animate-out data-closed:fade-out-0 data-open:animate-in data-open:fade-in-0 md:hidden" />
        <DialogPrimitive.Content className="fixed inset-y-0 left-0 z-50 w-72 border-r shadow-lg outline-none data-closed:animate-out data-closed:slide-out-to-left data-open:animate-in data-open:slide-in-from-left md:hidden">
          <DialogPrimitive.Title className="sr-only">menu</DialogPrimitive.Title>
          {children}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
