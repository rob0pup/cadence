import "./globals.css";

import type { Metadata, Viewport } from "next";
import { Suspense } from "react";

import { NowPlaying } from "@/app/now-playing";
import { CommandMenu } from "@/components/command-menu";
import { PlaybackControls } from "@/app/playback-controls";
import { PlaybackProvider } from "@/app/playback-context";
import { QueuePanel } from "@/app/queue-panel";
import { Sidebar } from "@/app/sidebar";
import { Providers } from "@/components/providers";
import { fontVariables } from "@/lib/fonts";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "cadence",
  description: "a music player for your own library",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(fontVariables, "font-sans")}
      suppressHydrationWarning
    >
      <body className="h-[100dvh] overflow-hidden">
        <Providers>
          <PlaybackProvider>
            <div className="flex h-full flex-col">
              <div className="flex min-h-0 flex-1">
                <Suspense fallback={<div className="w-60 shrink-0 border-r bg-sidebar" />}>
                  <Sidebar />
                </Suspense>
                <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
                  {children}
                </main>
                <NowPlaying />
              </div>
              <PlaybackControls />
            </div>
            <QueuePanel />
            <CommandMenu />
          </PlaybackProvider>
        </Providers>
      </body>
    </html>
  );
}
