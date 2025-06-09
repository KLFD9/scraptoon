import { NextResponse } from 'next/server';
import { logger } from '@/app/utils/logger';
import type { Manga } from '@/app/types/manga';

const mockRecommendations: Manga[] = [
  {
    id: '1',
    title: 'Dragon Ball Super',
    description: 'La suite de Dragon Ball Z avec de nouveaux ennemis puissants',
    cover: 'https://cdn.myanimelist.net/images/manga/2/209843.jpg',
    url: '/manga/dragon-ball-super',
    type: 'manga',
    status: 'ongoing',
    lastChapter: '98',
    chapterCount: {
      french: 98,
      total: 98
    },
    author: 'Akira Toriyama',
    artist: 'Toyotaro',
  },
  {
    id: '2',
    title: 'One Punch Man',
    description: 'L\'histoire de Saitama, un héros capable de vaincre n\'importe quel adversaire d\'un seul coup',
    cover: 'https://cdn.myanimelist.net/images/manga/3/80661.jpg',
    url: '/manga/one-punch-man',
    type: 'manga',
    status: 'ongoing',
    lastChapter: '194',
    chapterCount: {
      french: 180,
      total: 194
    },
    author: 'ONE',
    artist: 'Yusuke Murata',
  },
  {
    id: '3',
    title: 'My Hero Academia',
    description: 'Dans un monde où 80% de la population possède un super-pouvoir, Izuku Midoriya en est dépourvu',
    cover: 'https://cdn.myanimelist.net/images/manga/1/209370.jpg',
    url: '/manga/my-hero-academia',
    type: 'manga',
    status: 'completed',
    lastChapter: '430',
    chapterCount: {
      french: 430,
      total: 430
    },
    author: 'Kohei Horikoshi',
  },
  {
    id: '4',
    title: 'Jujutsu Kaisen',
    description: 'Yuji Itadori est un étudiant possédant une force physique extraordinaire',
    cover: 'https://cdn.myanimelist.net/images/manga/3/216464.jpg',
    url: '/manga/jujutsu-kaisen',
    type: 'manga',
    status: 'ongoing',
    lastChapter: '255',
    chapterCount: {
      french: 240,
      total: 255
    },
    author: 'Gege Akutami',
  },
  {
    id: '5',
    title: 'Chainsaw Man',
    description: 'Denji, pauvre et endetté, devient un homme tronçonneuse après avoir fusionné avec son chien-démon',
    cover: 'https://cdn.myanimelist.net/images/manga/3/216464.jpg',
    url: '/manga/chainsaw-man',
    type: 'manga',
    status: 'ongoing',
    lastChapter: '160',
    chapterCount: {
      french: 150,
      total: 160
    },
    author: 'Tatsuki Fujimoto',
  }
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get('limit') || '5');
    
    logger.log('info', 'Serving mock recommendations', { limit });
    
    // Toujours retourner les recommandations simulées
    return NextResponse.json({ 
      success: true, 
      results: mockRecommendations.slice(0, limit),
      cached: false,
      source: 'mock'
    });
  } catch (error) {
    logger.log('error', 'Erreur recommandations simulées', { error: String(error) });
    return NextResponse.json({ success: false, error: 'Erreur lors des recommandations' }, { status: 500 });
  }
}
