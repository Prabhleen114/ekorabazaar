import { NextRequest } from 'next/server';
import { handleApiRequest, registerRoutes } from '@/server/api/router';
import { allRoutes } from '@/server/api/routes';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

registerRoutes(allRoutes);

interface RouteContext {
  params: Promise<{ slug: string[] }>;
}

export async function GET(req: NextRequest, context: RouteContext) {
  const { slug } = await context.params;
  return handleApiRequest('GET', slug, req);
}

export async function POST(req: NextRequest, context: RouteContext) {
  const { slug } = await context.params;
  return handleApiRequest('POST', slug, req);
}

export async function PUT(req: NextRequest, context: RouteContext) {
  const { slug } = await context.params;
  return handleApiRequest('PUT', slug, req);
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  const { slug } = await context.params;
  return handleApiRequest('PATCH', slug, req);
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  const { slug } = await context.params;
  return handleApiRequest('DELETE', slug, req);
}

export async function HEAD(req: NextRequest, context: RouteContext) {
  const { slug } = await context.params;
  return handleApiRequest('HEAD', slug, req);
}

export async function OPTIONS(req: NextRequest, context: RouteContext) {
  const { slug } = await context.params;
  return handleApiRequest('OPTIONS', slug, req);
}
