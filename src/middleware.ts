import { NextRequest, NextResponse } from 'next/server';

/**
 * Middleware Next.js (Edge runtime).
 *
 * Responsabilités :
 *  - Laisser passer les assets statiques et routes publiques sans traitement.
 *  - La vérification JWT est intentionnellement absente ici car `jsonwebtoken`
 *    n'est pas compatible avec le runtime Edge. Elle est effectuée dans chaque
 *    route handler via `requireAuth` (Node.js runtime).
 *  - Les en-têtes de sécurité HTTP sont définis dans next.config.ts.
 */
export function middleware(_req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
