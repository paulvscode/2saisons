import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifyToken } from "@/lib/jwt";

// Protège les espaces authentifiés. Le contrôle fin du rôle est fait
// côté serveur dans les layouts (requireUser / requireAdmin).
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifyToken(token) : null;

  if (!session) {
    const url = new URL("/login", req.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/admin") && session.role !== "admin") {
    return NextResponse.redirect(new URL("/compte", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/compte", "/compte/:path*", "/admin", "/admin/:path*"],
};
