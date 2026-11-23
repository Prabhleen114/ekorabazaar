import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock session and db
vi.mock('@/lib/session', () => ({
  getSession: vi.fn(),
  createSession: vi.fn().mockResolvedValue(undefined),
  clearSession: vi.fn().mockResolvedValue(undefined),
  encrypt: vi.fn().mockResolvedValue('mock-encrypted-jwt-token'),
}));

vi.mock('@/lib/db', () => ({
  default: {
    user: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import prisma from '@/lib/db';
import { createSession } from '@/lib/session';
import {
  getAuthOrigin,
  getOAuthRedirectUri,
  handleGoogle,
  handleGoogleCallback,
} from '@/server/api/handlers/auth';

function createRequest(
  url: string,
  options?: {
    method?: string;
    headers?: Record<string, string>;
    cookies?: Record<string, string>;
  }
): NextRequest {
  const req = new NextRequest(url, {
    method: options?.method || 'GET',
    headers: options?.headers,
  });

  if (options?.cookies) {
    for (const [name, value] of Object.entries(options.cookies)) {
      req.cookies.set(name, value);
    }
  }

  return req;
}

describe('Google OAuth & Railway Deployment Flow Verification', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('1. Origin & Redirect URI Resolution (Railway / Reverse Proxies)', () => {
    it('uses explicitly configured NEXT_PUBLIC_APP_URL', () => {
      process.env.NEXT_PUBLIC_APP_URL = 'https://ekorabazaar.in';
      const origin = getAuthOrigin();
      expect(origin).toBe('https://ekorabazaar.in');
      expect(getOAuthRedirectUri(origin)).toBe('https://ekorabazaar.in/api/auth/google/callback');
    });

    it('uses explicitly configured APP_URL with priority', () => {
      process.env.APP_URL = 'https://ekorabazaar.in';
      process.env.NEXT_PUBLIC_APP_URL = 'https://other.com';
      const origin = getAuthOrigin();
      expect(origin).toBe('https://ekorabazaar.in');
    });

    it('derives origin from reverse proxy headers (x-forwarded-host, x-forwarded-proto)', () => {
      delete process.env.APP_URL;
      delete process.env.NEXT_PUBLIC_APP_URL;

      const req = createRequest('http://0.0.0.0:3000/api/auth/google', {
        headers: {
          'x-forwarded-host': 'ekorabazaar.in',
          'x-forwarded-proto': 'https',
          host: '0.0.0.0:3000',
        },
      });

      const origin = getAuthOrigin(req);
      expect(origin).toBe('https://ekorabazaar.in');
      expect(getOAuthRedirectUri(origin)).toBe('https://ekorabazaar.in/api/auth/google/callback');
    });

    it('handles comma-separated proxy header lists from multi-tier proxies (Cloudflare -> Railway)', () => {
      delete process.env.APP_URL;
      delete process.env.NEXT_PUBLIC_APP_URL;

      const req = createRequest('http://127.0.0.1:8080/api/auth/google', {
        headers: {
          'x-forwarded-host': 'ekorabazaar.in, 10.0.0.1',
          'x-forwarded-proto': 'https, http',
          host: '127.0.0.1:8080',
        },
      });

      const origin = getAuthOrigin(req);
      expect(origin).toBe('https://ekorabazaar.in');
      expect(getOAuthRedirectUri(origin)).toBe('https://ekorabazaar.in/api/auth/google/callback');
    });

    it('derives origin for Railway public domain if accessed via up.railway.app', () => {
      delete process.env.APP_URL;
      delete process.env.NEXT_PUBLIC_APP_URL;

      const req = createRequest('http://0.0.0.0:3000/api/auth/google', {
        headers: {
          'x-forwarded-host': 'ekorabazaar-production.up.railway.app',
          'x-forwarded-proto': 'https',
        },
      });

      const origin = getAuthOrigin(req);
      expect(origin).toBe('https://ekorabazaar-production.up.railway.app');
      expect(getOAuthRedirectUri(origin)).toBe(
        'https://ekorabazaar-production.up.railway.app/api/auth/google/callback'
      );
    });

    it('falls back to RAILWAY_PUBLIC_DOMAIN in Railway environment when request headers are absent', () => {
      delete process.env.APP_URL;
      delete process.env.NEXT_PUBLIC_APP_URL;
      process.env.RAILWAY_PUBLIC_DOMAIN = 'ekorabazaar-production.up.railway.app';

      const origin = getAuthOrigin();
      expect(origin).toBe('https://ekorabazaar-production.up.railway.app');
    });

    it('falls back safely to canonical domain in production when internal container address is received', () => {
      delete process.env.APP_URL;
      delete process.env.NEXT_PUBLIC_APP_URL;
      delete process.env.RAILWAY_PUBLIC_DOMAIN;
      process.env.NODE_ENV = 'production';

      const req = createRequest('http://0.0.0.0:3000/api/auth/google', {
        headers: {
          host: '0.0.0.0:3000',
        },
      });

      const origin = getAuthOrigin(req);
      expect(origin).toBe('https://ekorabazaar.in');
    });

    it('defaults to http://localhost:3000 during local development', () => {
      delete process.env.APP_URL;
      delete process.env.NEXT_PUBLIC_APP_URL;
      delete process.env.RAILWAY_PUBLIC_DOMAIN;
      process.env.NODE_ENV = 'development';

      const req = createRequest('http://localhost:3000/api/auth/google', {
        headers: { host: 'localhost:3000' },
      });

      const origin = getAuthOrigin(req);
      expect(origin).toBe('http://localhost:3000');
      expect(getOAuthRedirectUri(origin)).toBe('http://localhost:3000/api/auth/google/callback');
    });

    it('normalizes trailing slashes when building callback URI', () => {
      expect(getOAuthRedirectUri('https://ekorabazaar.in/')).toBe(
        'https://ekorabazaar.in/api/auth/google/callback'
      );
    });
  });

  describe('2. Authorization Request Initiation (handleGoogle)', () => {
    it('returns 503 if GOOGLE_CLIENT_ID is not configured', async () => {
      delete process.env.GOOGLE_CLIENT_ID;
      delete process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

      const req = createRequest('https://ekorabazaar.in/api/auth/google');
      const res = await handleGoogle(req);

      expect(res.status).toBe(503);
      const data = await res.json();
      expect(data.error).toContain('Google OAuth is not configured');
    });

    it('generates compliant Google auth URL with state and cookie', async () => {
      process.env.GOOGLE_CLIENT_ID = 'test-client-id.apps.googleusercontent.com';
      process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';
      process.env.NEXT_PUBLIC_APP_URL = 'https://ekorabazaar.in';

      const req = createRequest('https://ekorabazaar.in/api/auth/google?redirect=/checkout');
      const res = await handleGoogle(req);

      expect(res.status).toBe(307); // NextResponse.redirect default
      const location = res.headers.get('location');
      expect(location).toBeTruthy();

      const parsedUrl = new URL(location!);
      expect(parsedUrl.origin).toBe('https://accounts.google.com');
      expect(parsedUrl.pathname).toBe('/o/oauth2/v2/auth');
      expect(parsedUrl.searchParams.get('client_id')).toBe('test-client-id.apps.googleusercontent.com');
      expect(parsedUrl.searchParams.get('redirect_uri')).toBe('https://ekorabazaar.in/api/auth/google/callback');
      expect(parsedUrl.searchParams.get('response_type')).toBe('code');
      expect(parsedUrl.searchParams.get('scope')).toBe('openid email profile');
      expect(parsedUrl.searchParams.get('access_type')).toBe('offline');

      // Check state payload
      const stateParam = parsedUrl.searchParams.get('state')!;
      expect(stateParam).toBeTruthy();
      const decodedState = JSON.parse(Buffer.from(stateParam, 'base64url').toString('utf8'));
      expect(decodedState.redirect).toBe('/checkout');
      expect(decodedState.redirectUri).toBe('https://ekorabazaar.in/api/auth/google/callback');

      // Check oauth_state cookie
      const cookieHeader = res.headers.get('set-cookie');
      expect(cookieHeader).toContain('oauth_state=');
      expect(cookieHeader).toContain('HttpOnly');
      expect(cookieHeader?.toLowerCase()).toContain('samesite=lax');
    });
  });

  describe('3. OAuth Callback Handling & Session Creation (handleGoogleCallback)', () => {
    const originalFetch = global.fetch;

    beforeEach(() => {
      process.env.GOOGLE_CLIENT_ID = 'test-client-id.apps.googleusercontent.com';
      process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';
      process.env.NEXT_PUBLIC_APP_URL = 'https://ekorabazaar.in';
    });

    afterEach(() => {
      global.fetch = originalFetch;
    });

    it('redirects with error parameter if Google reports an error', async () => {
      const req = createRequest('https://ekorabazaar.in/api/auth/google/callback?error=access_denied');
      const res = await handleGoogleCallback(req);

      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe('https://ekorabazaar.in/login?error=access_denied');
    });

    it('redirects with missing_code if code is absent', async () => {
      const req = createRequest('https://ekorabazaar.in/api/auth/google/callback');
      const res = await handleGoogleCallback(req);

      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe('https://ekorabazaar.in/login?error=missing_code');
    });

    it('rejects if oauth_state cookie does not match state parameter (CSRF protection)', async () => {
      const state = Buffer.from(JSON.stringify({ redirect: '/', redirectUri: 'https://ekorabazaar.in/api/auth/google/callback' })).toString('base64url');

      const req = createRequest(`https://ekorabazaar.in/api/auth/google/callback?code=mock_code&state=${state}`, {
        cookies: { oauth_state: 'different-state-cookie' },
      });

      const res = await handleGoogleCallback(req);
      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe('https://ekorabazaar.in/login?error=csrf_mismatch');
    });

    it('successfully authenticates, provisions customer, sets session cookie, and redirects', async () => {
      const statePayload = {
        redirect: '/account',
        nonce: 'xyz123',
        redirectUri: 'https://ekorabazaar.in/api/auth/google/callback',
      };
      const state = Buffer.from(JSON.stringify(statePayload)).toString('base64url');

      // Mock Google Token & UserInfo endpoints
      const mockFetch = vi.fn().mockImplementation((url: string) => {
        if (url === 'https://oauth2.googleapis.com/token') {
          return Promise.resolve(
            new Response(
              JSON.stringify({
                access_token: 'mock-google-access-token',
                token_type: 'Bearer',
                expires_in: 3600,
              }),
              { status: 200, headers: { 'Content-Type': 'application/json' } }
            )
          );
        }
        if (url === 'https://www.googleapis.com/oauth2/v3/userinfo') {
          return Promise.resolve(
            new Response(
              JSON.stringify({
                sub: 'google-sub-12345',
                email: 'maker@ekorabazaar.com',
                name: 'Ekora Maker',
                picture: 'https://example.com/avatar.jpg',
              }),
              { status: 200, headers: { 'Content-Type': 'application/json' } }
            )
          );
        }
        return Promise.reject(new Error(`Unhandled URL in test: ${url}`));
      });
      global.fetch = mockFetch;

      // Mock Prisma user creation
      (prisma.user.findFirst as any).mockResolvedValue(null);
      (prisma.user.create as any).mockResolvedValue({
        id: 'new-user-id',
        email: 'maker@ekorabazaar.com',
        name: 'Ekora Maker',
        googleId: 'google-sub-12345',
        role: 'CUSTOMER',
        seller: null,
      });

      const req = createRequest(
        `https://ekorabazaar.in/api/auth/google/callback?code=auth_code_123&state=${state}`,
        {
          cookies: { oauth_state: state },
        }
      );

      const res = await handleGoogleCallback(req);

      // Verify Google Token Exchange called with exact redirect_uri
      expect(mockFetch).toHaveBeenCalledWith(
        'https://oauth2.googleapis.com/token',
        expect.objectContaining({
          method: 'POST',
          body: expect.any(URLSearchParams),
        })
      );

      const tokenCallBody = mockFetch.mock.calls[0][1].body as URLSearchParams;
      expect(tokenCallBody.get('code')).toBe('auth_code_123');
      expect(tokenCallBody.get('client_id')).toBe('test-client-id.apps.googleusercontent.com');
      expect(tokenCallBody.get('redirect_uri')).toBe('https://ekorabazaar.in/api/auth/google/callback');

      // Verify User Created with CUSTOMER role
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: 'maker@ekorabazaar.com',
          name: 'Ekora Maker',
          googleId: 'google-sub-12345',
          role: 'CUSTOMER',
        },
        include: { seller: true },
      });

      // Verify Session Creation
      expect(createSession).toHaveBeenCalledWith({
        userId: 'new-user-id',
        role: 'CUSTOMER',
        sellerId: null,
      });

      // Verify response redirect and session cookie
      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe('https://ekorabazaar.in/account');

      const setCookies = res.headers.get('set-cookie');
      expect(setCookies).toContain('session=mock-encrypted-jwt-token');
      expect(setCookies).toContain('oauth_state=;'); // deleted
    });

    it('links googleId when existing email user logs in via Google', async () => {
      const state = Buffer.from(
        JSON.stringify({
          redirect: '/',
          redirectUri: 'https://ekorabazaar.in/api/auth/google/callback',
        })
      ).toString('base64url');

      global.fetch = vi.fn().mockImplementation((url: string) => {
        if (url === 'https://oauth2.googleapis.com/token') {
          return Promise.resolve(
            new Response(JSON.stringify({ access_token: 'mock-token' }), { status: 200 })
          );
        }
        if (url === 'https://www.googleapis.com/oauth2/v3/userinfo') {
          return Promise.resolve(
            new Response(
              JSON.stringify({
                sub: 'google-sub-999',
                email: 'existing@ekorabazaar.com',
                name: 'Existing User',
              }),
              { status: 200 }
            )
          );
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      (prisma.user.findFirst as any).mockResolvedValue({
        id: 'existing-id',
        email: 'existing@ekorabazaar.com',
        googleId: null,
        name: null,
        role: 'ADMIN',
        seller: null,
      });

      (prisma.user.update as any).mockResolvedValue({
        id: 'existing-id',
        email: 'existing@ekorabazaar.com',
        googleId: 'google-sub-999',
        name: 'Existing User',
        role: 'ADMIN',
        seller: null,
      });

      const req = createRequest(
        `https://ekorabazaar.in/api/auth/google/callback?code=mock_code&state=${state}`,
        {
          cookies: { oauth_state: state },
        }
      );

      const res = await handleGoogleCallback(req);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'existing-id' },
        data: {
          googleId: 'google-sub-999',
          name: 'Existing User',
        },
        include: { seller: true },
      });

      // Since user is ADMIN and redirect was '/', redirected to /admin
      expect(res.headers.get('location')).toBe('https://ekorabazaar.in/admin');
    });

    it('prevents open redirect attacks via malicious state payload', async () => {
      const state = Buffer.from(
        JSON.stringify({
          redirect: '//evil.com/phishing',
          redirectUri: 'https://ekorabazaar.in/api/auth/google/callback',
        })
      ).toString('base64url');

      global.fetch = vi.fn().mockImplementation((url: string) => {
        if (url === 'https://oauth2.googleapis.com/token') {
          return Promise.resolve(
            new Response(JSON.stringify({ access_token: 'mock-token' }), { status: 200 })
          );
        }
        if (url === 'https://www.googleapis.com/oauth2/v3/userinfo') {
          return Promise.resolve(
            new Response(
              JSON.stringify({
                sub: 'sub-open-redirect',
                email: 'test@example.com',
              }),
              { status: 200 }
            )
          );
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      (prisma.user.findFirst as any).mockResolvedValue({
        id: 'uid',
        email: 'test@example.com',
        googleId: 'sub-open-redirect',
        role: 'CUSTOMER',
        seller: null,
      });

      const req = createRequest(
        `https://ekorabazaar.in/api/auth/google/callback?code=mock_code&state=${state}`,
        {
          cookies: { oauth_state: state },
        }
      );

      const res = await handleGoogleCallback(req);
      // Malicious protocol-relative url '//evil.com/phishing' is neutralized to default '/'
      expect(res.headers.get('location')).toBe('https://ekorabazaar.in/');
    });
  });
});
