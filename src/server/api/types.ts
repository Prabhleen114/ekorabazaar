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
