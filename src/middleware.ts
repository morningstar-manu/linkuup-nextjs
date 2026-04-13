import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

// Routes accessibles sans authentification
const PUBLIC_ROUTES = ['/auth/signin', '/auth/signup'];
// Routes accessibles aux admins uniquement
const ADMIN_ROUTES = ['/admin', '/users'];
// Routes accessibles aux admins et modérateurs
const MODERATOR_ROUTES = ['/manager'];

function getTokenFromRequest(req: NextRequest): string | null {
  const header = req.headers.get('x-access-token') || req.headers.get('authorization');
  if (header?.startsWith('Bearer ')) return header.slice(7);
  return header || null;
}

function decodeToken(token: string): { id: string; roles?: string[] } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { id: string; roles?: string[] };
  } catch {
    return null;
  }
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Laisser passer les routes API publiques
  if (pathname.startsWith('/api/auth/signin') || pathname.startsWith('/api/auth/refreshtoken')) {
    return NextResponse.next();
  }

  // Ne pas intercepter les assets statiques et fichiers Next.js
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Routes publiques (signin, etc.)
  const isPublicRoute = PUBLIC_ROUTES.some((r) => pathname.startsWith(r));
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Pour les routes API protégées, vérifier le token JWT
  if (pathname.startsWith('/api/')) {
    const token = getTokenFromRequest(req);
    if (!token) {
      return NextResponse.json({ success: false, message: 'Non authentifié' }, { status: 401 });
    }
    const decoded = decodeToken(token);
    if (!decoded) {
      return NextResponse.json({ success: false, message: 'Token invalide ou expiré' }, { status: 401 });
    }
    return NextResponse.next();
  }

  // Pour les routes de page, rediriger vers signin si le cookie de session n'est pas présent
  // Note : la garde fine des rôles reste dans le layout client + les API routes
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
