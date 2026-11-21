import { NextRequest, NextResponse } from 'next/server';
import { RouteDefinition, RouteContext, HttpMethod } from './types';

interface CompiledRoute {
  method: HttpMethod;
  pattern: string;
  segments: string[];
  handler: RouteDefinition['handler'];
}

let compiledRoutes: CompiledRoute[] = [];

export function registerRoutes(routes: RouteDefinition[]) {
  compiledRoutes = routes.map((r) => {
    const cleanPattern = r.pattern.replace(/^\/+|\/+$/g, '');
    const segments = cleanPattern ? cleanPattern.split('/') : [];
    return {
      method: r.method,
      pattern: r.pattern,
      segments,
      handler: r.handler,
    };
  });
}

function matchRoute(
  routeSegments: string[],
  reqSegments: string[]
): { match: boolean; params: Record<string, string> } {
  if (routeSegments.length !== reqSegments.length) {
    return { match: false, params: {} };
  }

  const params: Record<string, string> = {};
  for (let i = 0; i < routeSegments.length; i++) {
    const rSeg = routeSegments[i];
    const uSeg = reqSegments[i];

    if (rSeg.startsWith(':')) {
      params[rSeg.slice(1)] = decodeURIComponent(uSeg);
    } else if (rSeg !== uSeg) {
      return { match: false, params: {} };
    }
  }

  return { match: true, params };
}

export async function handleApiRequest(
  method: string,
  slug: string[] | undefined,
  req: NextRequest
): Promise<NextResponse | Response> {
  const reqSegments = slug || [];
  let pathMatchedOtherMethod = false;

  for (const route of compiledRoutes) {
    const { match, params } = matchRoute(route.segments, reqSegments);
    if (match) {
      if (route.method === method) {
        const context: RouteContext = {
          params: Promise.resolve(params),
        };

        return await route.handler(req, context);
      } else {
        pathMatchedOtherMethod = true;
      }
    }
  }

  const pathStr = '/' + reqSegments.join('/');

  if (pathMatchedOtherMethod) {
    return NextResponse.json(
      { error: `Method ${method} Not Allowed on ${pathStr}` },
      { status: 405 }
    );
  }

  return NextResponse.json(
    { error: `Endpoint not found: ${method} ${pathStr}` },
    { status: 404 }
  );
}
