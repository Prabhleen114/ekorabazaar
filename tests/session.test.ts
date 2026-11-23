import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

import { cookies } from 'next/headers';
import { encrypt, decrypt, createSession, clearSession } from '@/lib/session';

describe('Session Management & Resilience', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('encrypts and decrypts session payload with JWT_SECRET', async () => {
    process.env.JWT_SECRET = 'test-secret-key-12345678901234567890123456789012';
    const payload = { userId: 'u123', role: 'CUSTOMER' as const, sellerId: null };

    const token = await encrypt(payload);
    expect(token).toBeTruthy();

    const decrypted = await decrypt(token);
    expect(decrypted?.userId).toBe('u123');
    expect(decrypted?.role).toBe('CUSTOMER');
    expect(decrypted?.sellerId).toBeNull();
  });

  it('falls back to SUPABASE_SERVICE_ROLE_KEY if JWT_SECRET is unset', async () => {
    delete process.env.JWT_SECRET;
    delete process.env.NEXTAUTH_SECRET;
    delete process.env.AUTH_SECRET;
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'supabase-service-role-key-secret-12345';

    const payload = { userId: 'u456', role: 'ADMIN' as const, sellerId: null };
    const token = await encrypt(payload);
    expect(token).toBeTruthy();

    const decrypted = await decrypt(token);
    expect(decrypted?.userId).toBe('u456');
    expect(decrypted?.role).toBe('ADMIN');
  });

  it('createSession does not crash if cookieStore.set throws in read-only phase', async () => {
    process.env.JWT_SECRET = 'test-secret-key-12345678901234567890123456789012';
    (cookies as any).mockResolvedValue({
      set: vi.fn().mockImplementation(() => {
        throw new Error('Cookies can only be modified in a Server Action or Route Handler.');
      }),
    });

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await expect(
      createSession({ userId: 'u789', role: 'CUSTOMER', sellerId: null })
    ).resolves.not.toThrow();

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('[Session] Note: cookieStore.set cannot be called in current phase:'),
      expect.stringContaining('Cookies can only be modified')
    );
    warnSpy.mockRestore();
  });

  it('clearSession does not crash if cookieStore.set throws in read-only phase', async () => {
    process.env.JWT_SECRET = 'test-secret-key-12345678901234567890123456789012';
    (cookies as any).mockResolvedValue({
      set: vi.fn().mockImplementation(() => {
        throw new Error('Cookies can only be modified in a Server Action or Route Handler.');
      }),
    });

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await expect(clearSession()).resolves.not.toThrow();

    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});
