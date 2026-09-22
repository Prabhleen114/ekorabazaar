import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

    if (!clientId) {
      return NextResponse.json(
        {
          error: 'Google OAuth is not configured yet. Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to your environment variables.',
        },
        { status: 503 }
      )
    }

    const { searchParams } = new URL(req.url)
    const redirectTo = searchParams.get('redirect') || '/'

    // Get origin cleanly from request headers or fallback to environment URL
    const host = req.headers.get('host') || 'localhost:3000'
    const protocol = req.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https')
    const origin = `${protocol}://${host}`
    const redirectUri = `${origin}/api/auth/google/callback`

    // Encode state with destination and random nonce for CSRF mitigation
    const statePayload = {
      redirect: redirectTo,
      nonce: Math.random().toString(36).substring(2, 15),
    }
    const state = Buffer.from(JSON.stringify(statePayload)).toString('base64url')

    const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
    googleAuthUrl.searchParams.set('client_id', clientId)
    googleAuthUrl.searchParams.set('redirect_uri', redirectUri)
    googleAuthUrl.searchParams.set('response_type', 'code')
    googleAuthUrl.searchParams.set('scope', 'openid email profile')
    googleAuthUrl.searchParams.set('state', state)
    googleAuthUrl.searchParams.set('access_type', 'offline')
    googleAuthUrl.searchParams.set('prompt', 'select_account')

    const response = NextResponse.redirect(googleAuthUrl.toString())
    // Store state in an HTTP-only cookie for CSRF verification
    response.cookies.set('oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 10, // 10 minutes
    })

    return response
  } catch (err: any) {
    console.error('Google OAuth init error:', err)
    return NextResponse.redirect(new URL('/login?error=oauth_init_failed', req.url))
  }
}
