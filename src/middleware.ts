import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

const publicPaths = ['/login', '/register', '/api/auth', '/api/webhooks'];
const authPaths = ['/login', '/register'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Allow public paths
  if (publicPaths.some(path => pathname.startsWith(path))) {
    // If user is authenticated and trying to access auth pages, redirect to dashboard
    if (authPaths.some(path => pathname.startsWith(path))) {
      const token = await getToken({ req: request });
      if (token) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }
    return NextResponse.next();
  }
  
  // Check authentication for protected routes
  const token = await getToken({ req: request });
  
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  // Check onboarding status
  if (!token.onboardingComplete && !pathname.startsWith('/onboarding') && !pathname.startsWith('/api')) {
    return NextResponse.redirect(new URL('/onboarding', request.url));
  }
  
  // Redirect from onboarding if already completed
  if (token.onboardingComplete && pathname.startsWith('/onboarding')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
