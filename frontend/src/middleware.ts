import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This function runs on every request (except those matched in config)
export function middleware(request: NextRequest) {
  // For now, just allow all requests
  return NextResponse.next();
}

// Optional: configure which paths the middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (static files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};