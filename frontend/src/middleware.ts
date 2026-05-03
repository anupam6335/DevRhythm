import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that require authentication (redirect to login if not authenticated)
const protectedRoutes = ['/dashboard', '/user/u/'];

// Auth routes – if user is already authenticated, redirect to dashboard
const authRoutes = ['/login'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('auth_token')?.value;

  if (pathname === '/') {
    return NextResponse.next();
  }

  // Redirect authenticated users away from auth routes (e.g., /login)
  if (token && authRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Redirect unauthenticated users away from protected routes
  if (!token && protectedRoutes.some(route => pathname.startsWith(route))) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('returnTo', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Allow all other requests
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Exclude internal Next.js routes and static files
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};