import { NextResponse, type NextRequest } from "next/server";
import { getSessionByToken } from "@/lib/auth/local-auth";

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

  const session = await getSessionByToken(sessionToken);

  if (!session || session.expiresAt < new Date()) {
    const response = NextResponse.redirect(new URL("/sign-in", req.url));
    response.cookies.delete("session_token");
    return response;
  }

  if (session.user.banned) {
    const response = NextResponse.redirect(
      new URL("/sign-in?error=banned", req.url),
    );
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|api/auth|export|sign-in|sign-up).*)",
  ],
};
