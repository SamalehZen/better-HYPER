import { NextResponse, type NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/ping")) {
    return new Response("pong", { status: 200 });
  }

  if (pathname === "/admin") {
    return NextResponse.redirect(new URL("/admin/users", req.url));
  }

  const sessionToken = req.cookies.get("session_token")?.value;

  const isAuthPage =
    pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up");
  const isPublicRoute =
    pathname.startsWith("/export/") || pathname.startsWith("/api/auth/");

  if (isAuthPage || isPublicRoute) {
    return NextResponse.next();
  }

  if (!sessionToken) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  // Edge runtime: do not touch database here. Cookie presence is enough.
  // Detailed validation (expiry/ban) is performed on server routes/pages.

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|api/auth|export|sign-in|sign-up).*)",
  ],
};
