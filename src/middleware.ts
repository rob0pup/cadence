import { NextResponse, type NextRequest } from "next/server";

import { auth0 } from "@/lib/auth0";

// Mounts the Auth0 routes (/auth/login, /auth/logout, /auth/callback, ...).
// It does NOT gate pages: logged-out visitors can still browse the demo library
// and use the player; write actions are gated separately. If Auth0 is
// unconfigured or unreachable, requests pass through as logged-out (demo).
export async function middleware(request: NextRequest) {
  try {
    return await auth0.middleware(request);
  } catch {
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|manifest.webmanifest|opengraph-image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|mp3)$).*)",
  ],
};
