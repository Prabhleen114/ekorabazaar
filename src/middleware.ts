import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { decrypt } from '@/lib/session'


// Protect these routes
const protectedRoutes = ['/admin', '/seller/dashboard']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Quick check if the route is protected
  const isProtected = protectedRoutes.some(route => pathname.startsWith(route))
  
  if (isProtected) {
    const sessionCookie = request.cookies.get('session')?.value
    
    if (!sessionCookie) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    const session = await decrypt(sessionCookie)
    if (!session) {
      // Clear invalid cookie implicitly by redirecting to a login route that clears it, or just redirect.
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Role-based route protection
    if (pathname.startsWith('/admin') && session.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', request.url)) // Or a 403 Forbidden page
    }

    if (pathname.startsWith('/seller') && session.role !== 'SELLER') {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  // Inject session details into headers for API routes to consume,
  // bypassing the need to read cookies twice.
  // Actually, for API routes, we can just read the cookie directly using `getSession()` in `src/lib/session.ts`
  // so we don't necessarily have to inject headers, but it's a valid pattern.

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
