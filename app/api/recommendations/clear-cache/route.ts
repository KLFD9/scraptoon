import { NextResponse } from 'next/server';
import { Cache } from '@/app/utils/cache';
import { logger } from '@/app/utils/logger';
import type { Manga } from '@/app/types/manga';

const cache = new Cache<Manga[]>(60 * 60 * 1000);

export async function POST() {
  try {
    // Vider le cache des recommandations
    await cache.clear();
    
    logger.log('info', '🗑️ Cache des recommandations vidé');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Cache des recommandations vidé avec succès' 
    });
  } catch (error) {
    logger.log('error', '❌ Erreur lors du vidage du cache', { 
      error: String(error) 
    });
    
    return NextResponse.json(
      { success: false, error: 'Erreur lors du vidage du cache' },
      { status: 500 }
    );
  }
}
