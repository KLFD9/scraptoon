import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Vérifier si c'est une route de chapitre
  if (pathname.match(/\/manga\/.*\/chapter\/.*/)) {
    // Continuer vers la page du chapitre
    return NextResponse.next();
  }
}

// Configuration des routes à intercepter
export const config = {
  matcher: [
    '/manga/:id/chapter/:chapterId*'
  ]
}; 