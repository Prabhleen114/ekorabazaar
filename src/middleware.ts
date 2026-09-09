import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { decrypt } from '@/lib/session'


// Protect these routes
const protectedRoutes = ['/admin', '/seller/dashboard']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // 1. Protect Sensitive API routes at the Edge perimeter
  if (pathname.startsWith('/api/admin') || pathname.startsWith('/api/seller')) {
    const sessionCookie = request.cookies.get('session')?.value
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const session = await decrypt(sessionCookie)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (pathname.startsWith('/api/admin') && session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }
    if (pathname.startsWith('/api/seller') && session.role !== 'SELLER' && session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Seller access required' }, { status: 403 })
    }
    return NextResponse.next()
  }

  // 2. Protect UI routes with clean redirects to login
  const isProtected = protectedRoutes.some(route => pathname.startsWith(route))
  
  if (isProtected) {
    const sessionCookie = request.cookies.get('session')?.value
    
    if (!sessionCookie) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.search = request.nextUrl.search // Preserve UTM params
      return NextResponse.redirect(loginUrl)
    }

    const session = await decrypt(sessionCookie)
    if (!session) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.search = request.nextUrl.search
      return NextResponse.redirect(loginUrl)
    }

    // Role-based route protection
    if (pathname.startsWith('/admin') && session.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', request.url))
    }

    if (pathname.startsWith('/seller') && session.role !== 'SELLER' && session.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/seller/dashboard/:path*',
    '/api/admin/:path*',
    '/api/seller/:path*'
  ],
}
