import "./globals.css";

import type { Metadata, Viewport } from "next";
import { Suspense } from "react";

import { NowPlaying } from "@/app/now-playing";
import { CommandMenu } from "@/components/command-menu";
import { PlaybackControls } from "@/app/playback-controls";
import { PlaybackProvider } from "@/app/playback-context";
import { QueuePanel } from "@/app/queue-panel";
import { AuthProvider } from "@/app/hooks/use-auth";
import { Sidebar, SidebarInner } from "@/app/sidebar";
import { MobileMenu } from "@/components/mobile-menu";
import { Providers } from "@/components/providers";
import { fontVariables } from "@/lib/fonts";
import { getAuthUser } from "@/lib/session";
import { getSpotifyStatus } from "@/lib/spotify";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Cadence",
  description: "A music player for your own library",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getAuthUser();
  const spotify = await getSpotifyStatus(user?.id ?? null);

  return (
    <html
      lang="en"
      className={cn(fontVariables, "font-sans")}
      suppressHydrationWarning
    >
      <body className="h-[100dvh] overflow-hidden">
        <Providers>
          <AuthProvider user={user} spotify={spotify}>
          <PlaybackProvider>
            <div className="flex h-full flex-col">
              <div className="flex min-h-0 flex-1">
                <Suspense fallback={<div className="w-60 shrink-0 border-r bg-sidebar" />}>
                  <Sidebar />
                </Suspense>
                <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
                  <MobileMenu>
                    <Suspense fallback={null}>
                      <SidebarInner />
                    </Suspense>
                  </MobileMenu>
                  {children}
                </main>
                <NowPlaying />
              </div>
              <PlaybackControls />
            </div>
            <QueuePanel />
            <CommandMenu />
          </PlaybackProvider>
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}
