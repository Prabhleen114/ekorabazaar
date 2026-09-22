import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { createSession } from '@/lib/session'

export async function GET(req: NextRequest) {
  const host = req.headers.get('host') || 'localhost:3000'
  const protocol = req.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https')
  const origin = `${protocol}://${host}`

  try {
    const { searchParams } = new URL(req.url)
    const code = searchParams.get('code')
    const stateParam = searchParams.get('state')
    const errorParam = searchParams.get('error')

    if (errorParam) {
      console.warn('Google OAuth returned error:', errorParam)
      return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(errorParam)}`, origin))
    }

    if (!code) {
      return NextResponse.redirect(new URL('/login?error=missing_code', origin))
    }

    // Decode state destination
    let redirectTo = '/'
    if (stateParam) {
      try {
        const decoded = JSON.parse(Buffer.from(stateParam, 'base64url').toString('utf8'))
        if (decoded && decoded.redirect && typeof decoded.redirect === 'string' && decoded.redirect.startsWith('/')) {
          redirectTo = decoded.redirect
        }
      } catch (e) {
        console.warn('Failed to parse oauth state', e)
      }
    }

    const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET
    const redirectUri = `${origin}/api/auth/google/callback`

    if (!clientId || !clientSecret) {
      console.error('Google OAuth credentials not configured')
      return NextResponse.redirect(new URL('/login?error=oauth_not_configured', origin))
    }

    // Exchange authorization code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    })

    if (!tokenRes.ok) {
      const errText = await tokenRes.text()
      console.error('Google token exchange error:', tokenRes.status, errText)
      return NextResponse.redirect(new URL('/login?error=token_exchange_failed', origin))
    }

    const tokenData = await tokenRes.json()
    const accessToken = tokenData.access_token

    // Fetch user info from Google
    const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (!userRes.ok) {
      console.error('Failed to fetch Google user profile')
      return NextResponse.redirect(new URL('/login?error=profile_fetch_failed', origin))
    }

    const googleUser = await userRes.json()
    const { sub: googleId, email, name } = googleUser

    if (!email) {
      return NextResponse.redirect(new URL('/login?error=no_email_from_google', origin))
    }

    // Upsert / Link user in database
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { googleId: googleId },
          { email: email.toLowerCase() }
        ]
      },
      include: { seller: true }
    })

    if (user) {
      // If user exists without googleId or without name, update them
      if (!user.googleId || (!user.name && name)) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            googleId: user.googleId || googleId,
            name: user.name || name || null,
          },
          include: { seller: true }
        })
      }
    } else {
      // Create new user account via Google
      user = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          name: name || null,
          googleId: googleId,
          role: 'CUSTOMER',
        },
        include: { seller: true }
      })
    }

    // Create session
    await createSession({
      userId: user.id,
      role: user.role,
      sellerId: user.seller?.id || null,
    })

    // Determine final redirect destination
    let finalDestination = redirectTo
    if (finalDestination === '/') {
      if (user.role === 'ADMIN') finalDestination = '/admin'
      else if (user.role === 'SELLER') finalDestination = '/seller/dashboard'
    }

    const response = NextResponse.redirect(new URL(finalDestination, origin))
    // Clear state cookie
    response.cookies.delete('oauth_state')
    return response

  } catch (error: any) {
    console.error('Google OAuth callback error:', error)
    return NextResponse.redirect(new URL('/login?error=auth_internal_error', origin))
  }
}
