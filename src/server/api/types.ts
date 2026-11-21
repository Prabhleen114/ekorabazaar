import { NextRequest, NextResponse } from 'next/server';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

export interface RouteContext {
  params: Promise<Record<string, string>>;
}

export type RouteHandler = (
  req: NextRequest,
  context: RouteContext
) => Promise<NextResponse | Response> | NextResponse | Response;

export interface RouteDefinition {
  method: HttpMethod;
  pattern: string; // e.g. "/account/orders", "/addresses/:id", "/docs/:slug/:type"
  handler: RouteHandler;
}

export function handleAuthError(error: any): NextResponse | null {
  if (!error) return null;
  const msg = typeof error === 'string' ? error : error.message;
  if (msg === 'UNAUTHORIZED') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (typeof msg === 'string' && msg.includes('FORBIDDEN')) {
    return NextResponse.json({ error: msg || 'Forbidden' }, { status: 403 });
  }
  return null;
}
