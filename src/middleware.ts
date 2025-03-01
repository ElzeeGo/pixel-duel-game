import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Define public paths that don't require authentication
  const publicPaths = ["/", "/login", "/register"];
  const isPublicPath = publicPaths.some((path) => 
    pathname === path || pathname.startsWith("/api/auth")
  );

  // Get the token
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Redirect logic
  if (isPublicPath) {
    // If user is logged in and trying to access login/register page, redirect to game
    if (token && (pathname === "/login" || pathname === "/register")) {
      return NextResponse.redirect(new URL("/game", request.url));
    }
    return NextResponse.next();
  }

  // If user is not logged in and trying to access protected route, redirect to login
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
}; 