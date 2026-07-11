"use client";

import { ThemeProvider } from "next-themes";
import { NuqsAdapter } from "nuqs/adapters/next/app";

import { KeyboardShortcuts } from "@/components/keyboard-shortcuts";
import { RegisterSW } from "@/components/register-sw";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
      enableColorScheme
      storageKey="theme"
    >
      <NuqsAdapter>
        <TooltipProvider>{children}</TooltipProvider>
      </NuqsAdapter>
      <Toaster position="top-center" />
      <KeyboardShortcuts />
      <RegisterSW />
    </ThemeProvider>
  );
}
