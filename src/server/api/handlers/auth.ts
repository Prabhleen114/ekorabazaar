import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import bcrypt from 'bcrypt';
import { getSession, createSession, clearSession, encrypt } from '@/lib/session';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { validateBody, SignupSchema } from '@/lib/validation';

export async function handleMe(_req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ user: null });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        businessName: true,
        role: true,
        createdAt: true,
        seller: {
          select: {
            id: true,
            brandName: true,
            accountStatus: true,
          },
        },
        addresses: {
          where: { isDefault: true },
          select: {
            name: true,
            phone: true,
          },
          take: 1,
        },
      },
    });

    if (!user) {
      return NextResponse.json({ user: null });
    }

    const displayName =
      user.name ||
      user.addresses?.[0]?.name ||
      user.seller?.brandName ||
      user.email.split('@')[0];
    const contactPhone = user.phone || user.addresses?.[0]?.phone || null;

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name || null,
        phone: contactPhone,
        businessName: user.businessName || null,
        role: user.role,
        displayName,
        createdAt: user.createdAt,
        seller: user.seller || null,
      },
    });
  } catch (error: any) {
    console.error('GET /api/auth/me error:', error);
    return NextResponse.json({ user: null });
  }
}

export async function handleLogin(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const limitResult = rateLimit(`login:${ip}`, { limit: 10, windowMs: 60000 });
    if (!limitResult.success) {
      return NextResponse.json(
        { error: `Too many login attempts. Please try again in ${limitResult.reset} seconds.` },
        {
          status: 429,
          headers: { 'Retry-After': String(limitResult.reset) },
        }
      );
    }

    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { seller: true },
    });

    if (!user || !user.passwordHash) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    await createSession({
      userId: user.id,
      role: user.role,
      sellerId: user.seller?.id || null,
    });

    let redirectUrl = '/';
    if (user.role === 'ADMIN') redirectUrl = '/admin';
    else if (user.role === 'SELLER') redirectUrl = '/seller/dashboard';

    return NextResponse.json({ success: true, redirectUrl });
  } catch (error) {
    console.error('Login Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function handleSignup(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const limitResult = rateLimit(`signup:${ip}`, { limit: 5, windowMs: 60000 });
    if (!limitResult.success) {
      return NextResponse.json(
        { error: `Too many accounts created from this IP. Please try again in ${limitResult.reset} seconds.` },
        {
          status: 429,
          headers: { 'Retry-After': String(limitResult.reset) },
        }
      );
    }

    const rawBody = await req.json();
    const validation = validateBody(SignupSchema, rawBody);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }
    const { email, password, name, phone } = validation.data;
    const businessName =
      typeof rawBody.businessName === 'string'
        ? rawBody.businessName.trim().slice(0, 150)
        : null;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json({ error: 'Please provide a valid email address.' }, { status: 400 });
    }

    if (typeof password !== 'string' || password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
    }

    let cleanedPhone: string | null = null;
    if (phone && typeof phone === 'string') {
      const rawDigits = phone.replace(/\D/g, '');
      if (rawDigits.length === 10) {
        cleanedPhone = `+91${rawDigits}`;
      } else if (rawDigits.length === 12 && rawDigits.startsWith('91')) {
        cleanedPhone = `+${rawDigits}`;
      } else if (rawDigits.length >= 7) {
        cleanedPhone = phone.trim();
      }
    }

    const existingEmail = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existingEmail) {
      return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
    }

    if (cleanedPhone) {
      const existingPhone = await prisma.user.findUnique({ where: { phone: cleanedPhone } });
      if (existingPhone) {
        return NextResponse.json({ error: 'An account with this phone number already exists.' }, { status: 409 });
      }
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        name: name ? String(name).trim() : null,
        phone: cleanedPhone,
        businessName: businessName ? String(businessName).trim() : null,
        role: 'CUSTOMER',
      },
    });

    await createSession({ userId: user.id, role: user.role, sellerId: null });
    return NextResponse.json({ success: true, redirectUrl: '/' }, { status: 201 });
  } catch (error: any) {
    console.error('Signup Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function handleLogout() {
  await clearSession();
  return NextResponse.json({ success: true, redirectUrl: '/' });
}

/**
 * Resolves the trusted public origin for OAuth flows and redirects.
 * Prioritizes:
 * 1. Explicitly configured APP_URL or NEXT_PUBLIC_APP_URL
 * 2. Reverse proxy headers (x-forwarded-host, x-forwarded-proto) set by Railway / Cloudflare
 * 3. RAILWAY_PUBLIC_DOMAIN (Railway platform environment variable)
 * 4. Production canonical domain (https://ekorabazaar.in) or localhost in development
 */
export function getAuthOrigin(req?: NextRequest): string {
  // 1. Explicitly configured canonical application URL
  const configuredUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL;
  if (configuredUrl) {
    try {
      const parsed = new URL(configuredUrl.trim());
      return parsed.origin;
    } catch {
      // Ignore invalid configured URL and proceed to dynamic detection
    }
  }

  // 2. Request header inspection (supporting reverse proxy forwarding)
  if (req) {
    const forwardedHost = req.headers.get('x-forwarded-host');
    const rawHost = forwardedHost ? forwardedHost.split(',')[0].trim() : req.headers.get('host')?.trim();

    const forwardedProto = req.headers.get('x-forwarded-proto');
    let proto = forwardedProto ? forwardedProto.split(',')[0].trim() : '';

    if (rawHost) {
      const isLocal =
        rawHost.includes('localhost') ||
        rawHost.startsWith('127.0.0.1') ||
        rawHost.startsWith('0.0.0.0');

      if (!proto) {
        proto = isLocal ? 'http' : 'https';
      }

      // Enforce HTTPS in production for public hosts
      if (!isLocal && process.env.NODE_ENV === 'production') {
        proto = 'https';
      }

      // If host resolves to localhost/0.0.0.0 inside a production container (e.g. Railway internal container address)
      if (isLocal && (process.env.NODE_ENV === 'production' || process.env.RAILWAY_ENVIRONMENT)) {
        if (process.env.RAILWAY_PUBLIC_DOMAIN) {
          return `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
        }
        return 'https://ekorabazaar.in';
      }

      return `${proto}://${rawHost}`;
    }
  }

  // 3. Fallback to Railway default domain if provided by Railway environment
  if (process.env.RAILWAY_PUBLIC_DOMAIN) {
    return `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
  }

  // 4. Default fallback: production domain or localhost
  return process.env.NODE_ENV === 'production' ? 'https://ekorabazaar.in' : 'http://localhost:3000';
}

/**
 * Returns the exact Google OAuth callback URI for a given origin.
 */
export function getOAuthRedirectUri(origin: string): string {
  return `${origin.replace(/\/+$/, '')}/api/auth/google/callback`;
}

export async function handleGoogle(req: NextRequest) {
  try {
    const rawClientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const clientId = rawClientId?.trim();

    if (!clientId) {
      return NextResponse.json(
        {
          error:
            'Google OAuth is not configured yet. Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to your environment variables.',
        },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(req.url);
    const redirectTo = searchParams.get('redirect') || '/';

    const origin = getAuthOrigin(req);
    const redirectUri = getOAuthRedirectUri(origin);

    const statePayload = {
      redirect: redirectTo,
      nonce: Math.random().toString(36).substring(2, 15),
      redirectUri,
    };
    const state = Buffer.from(JSON.stringify(statePayload)).toString('base64url');

    const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    googleAuthUrl.searchParams.set('client_id', clientId);
    googleAuthUrl.searchParams.set('redirect_uri', redirectUri);
    googleAuthUrl.searchParams.set('response_type', 'code');
    googleAuthUrl.searchParams.set('scope', 'openid email profile');
    googleAuthUrl.searchParams.set('state', state);
    googleAuthUrl.searchParams.set('access_type', 'offline');
    googleAuthUrl.searchParams.set('prompt', 'select_account');

    const response = NextResponse.redirect(googleAuthUrl.toString());
    response.cookies.set('oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 10,
    });

    return response;
  } catch (err: any) {
    console.error('Google OAuth init error:', err);
    return NextResponse.redirect(new URL('/login?error=oauth_init_failed', req.url));
  }
}

export async function handleGoogleCallback(req: NextRequest) {
  const origin = getAuthOrigin(req);

  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const stateParam = searchParams.get('state');
    const errorParam = searchParams.get('error');

    if (errorParam) {
      console.warn('Google OAuth returned error:', errorParam);
      return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(errorParam)}`, origin));
    }

    if (!code) {
      return NextResponse.redirect(new URL('/login?error=missing_code', origin));
    }

    const storedState = req.cookies.get('oauth_state')?.value;
    if (!storedState || !stateParam || storedState !== stateParam) {
      console.warn('Google OAuth CSRF mismatch: state parameter does not match stored cookie');
      return NextResponse.redirect(new URL('/login?error=csrf_mismatch', origin));
    }

    let redirectTo = '/';
    let redirectUri = getOAuthRedirectUri(origin);

    if (stateParam) {
      try {
        const decoded = JSON.parse(Buffer.from(stateParam, 'base64url').toString('utf8'));
        if (
          decoded &&
          decoded.redirect &&
          typeof decoded.redirect === 'string' &&
          decoded.redirect.startsWith('/') &&
          !decoded.redirect.startsWith('//') &&
          !decoded.redirect.includes('\\')
        ) {
          redirectTo = decoded.redirect;
        }
        if (
          decoded &&
          decoded.redirectUri &&
          typeof decoded.redirectUri === 'string' &&
          decoded.redirectUri.startsWith('http')
        ) {
          redirectUri = decoded.redirectUri;
        }
      } catch (e) {
        console.warn('Failed to parse oauth state', e);
      }
    }

    const rawClientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const rawClientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const clientId = rawClientId?.trim();
    const clientSecret = rawClientSecret?.trim();

    if (!clientId || !clientSecret) {
      console.error('Google OAuth credentials not configured');
      return NextResponse.redirect(new URL('/login?error=oauth_not_configured', origin));
    }

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
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error('Google token exchange error:', tokenRes.status, errText);
      return NextResponse.redirect(new URL('/login?error=token_exchange_failed', origin));
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!userRes.ok) {
      console.error('Failed to fetch Google user profile');
      return NextResponse.redirect(new URL('/login?error=profile_fetch_failed', origin));
    }

    const googleUser = await userRes.json();
    const { sub: googleId, email, name } = googleUser;

    if (!email) {
      return NextResponse.redirect(new URL('/login?error=no_email_from_google', origin));
    }

    let user = await prisma.user.findFirst({
      where: {
        OR: [{ googleId: googleId }, { email: email.toLowerCase() }],
      },
      include: { seller: true },
    });

    if (user) {
      if (!user.googleId || (!user.name && name)) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            googleId: user.googleId || googleId,
            name: user.name || name || null,
          },
          include: { seller: true },
        });
      }
    } else {
      user = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          name: name || null,
          googleId: googleId,
          role: 'CUSTOMER',
        },
        include: { seller: true },
      });
    }

    const sessionPayload = {
      userId: user.id,
      role: user.role,
      sellerId: user.seller?.id || null,
    };

    await createSession(sessionPayload);
    const sessionToken = await encrypt(sessionPayload);

    let finalDestination = redirectTo;
    if (finalDestination === '/') {
      if (user.role === 'ADMIN') finalDestination = '/admin';
      else if (user.role === 'SELLER') finalDestination = '/seller/dashboard';
    }

    const response = NextResponse.redirect(new URL(finalDestination, origin));
    response.cookies.set('session', sessionToken, {
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
    response.cookies.delete('oauth_state');
    return response;
  } catch (error: any) {
    console.error('Google OAuth callback error:', error);
    return NextResponse.redirect(new URL('/login?error=auth_internal_error', origin));
  }
}
