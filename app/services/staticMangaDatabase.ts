import { Manga } from '../types/manga';

// Données statiques de mangas populaires avec de vraies informations
export const STATIC_MANGA_DATABASE: Manga[] = [
  // Mangas classiques
  {
    id: 'static-1',
    title: 'Berserk',
    description: 'L\'histoire sombre de Guts, un guerrier solitaire dans un monde médiéval fantastique.',
    cover: '/images/manga-placeholder.svg',
    url: '/manga/berserk',
    type: 'manga',
    status: 'ongoing',
    lastChapter: '374',
    chapterCount: { french: 350, total: 374 },
    author: 'Kentaro Miura',
    year: '1989'
  },
  {
    id: 'static-2',
    title: 'Vagabond',
    description: 'L\'épopée de Miyamoto Musashi, le plus grand samouraï de l\'histoire du Japon.',
    cover: '/images/manga-placeholder.svg',
    url: '/manga/vagabond',
    type: 'manga',
    status: 'ongoing',
    lastChapter: '327',
    chapterCount: { french: 300, total: 327 },
    author: 'Takehiko Inoue',
    year: '1998'
  },
  {
    id: 'static-3',
    title: 'Monster',
    description: 'Un thriller psychologique suivant un neurochirurgien dans l\'Allemagne post-guerre froide.',
    cover: '/images/manga-placeholder.svg',
    url: '/manga/monster',
    type: 'manga',
    status: 'completed',
    lastChapter: '162',
    chapterCount: { french: 162, total: 162 },
    author: 'Naoki Urasawa',
    year: '1994'
  },
  {
    id: 'static-4',
    title: '20th Century Boys',
    description: 'Un groupe d\'amis d\'enfance face à une conspiration apocalyptique.',
    cover: '/images/manga-placeholder.svg',
    url: '/manga/20th-century-boys',
    type: 'manga',
    status: 'completed',
    lastChapter: '249',
    chapterCount: { french: 249, total: 249 },
    author: 'Naoki Urasawa',
    year: '1999'
  },
  {
    id: 'static-5',
    title: 'Pluto',
    description: 'Une réinterprétation moderne d\'Astro Boy par Naoki Urasawa.',
    cover: '/images/manga-placeholder.svg',
    url: '/manga/pluto',
    type: 'manga',
    status: 'completed',
    lastChapter: '65',
    chapterCount: { french: 65, total: 65 },
    author: 'Naoki Urasawa',
    year: '2003'
  },
  // Manhwas populaires
  {
    id: 'static-6',
    title: 'The Breaker',
    description: 'Un lycéen découvre le monde secret des arts martiaux.',
    cover: '/images/manga-placeholder.svg',
    url: '/manga/the-breaker',
    type: 'manhwa',
    status: 'completed',
    lastChapter: '72',
    chapterCount: { french: 60, total: 72 },
    author: 'Jeon Keuk-jin',
    year: '2007'
  },
  {
    id: 'static-7',
    title: 'Tower of God',
    description: 'Rachel monte dans une tour mystérieuse pour réaliser ses rêves.',
    cover: '/images/manga-placeholder.svg',
    url: '/manga/tower-of-god',
    type: 'manhwa',
    status: 'ongoing',
    lastChapter: '600+',
    chapterCount: { french: 400, total: 600 },
    author: 'SIU',
    year: '2010'
  },
  {
    id: 'static-8',
    title: 'The God of High School',
    description: 'Un tournoi d\'arts martiaux lycéen cache des secrets surnaturels.',
    cover: '/images/manga-placeholder.svg',
    url: '/manga/god-of-high-school',
    type: 'manhwa',
    status: 'completed',
    lastChapter: '569',
    chapterCount: { french: 500, total: 569 },
    author: 'Yongje Park',
    year: '2011'
  },
  // Manhuas
  {
    id: 'static-9',
    title: 'Tales of Demons and Gods',
    description: 'Nie Li revient dans le passé pour sauver sa ville.',
    cover: '/images/manga-placeholder.svg',
    url: '/manga/tales-demons-gods',
    type: 'manhua',
    status: 'ongoing',
    lastChapter: '450+',
    chapterCount: { french: 400, total: 450 },
    author: 'Mad Snail',
    year: '2015'
  },
  {
    id: 'static-10',
    title: 'Battle Through the Heavens',
    description: 'Xiao Yan perd ses pouvoirs et doit les reconquérir.',
    cover: '/images/manga-placeholder.svg',
    url: '/manga/battle-through-heavens',
    type: 'manhua',
    status: 'ongoing',
    lastChapter: '350+',
    chapterCount: { french: 300, total: 350 },
    author: 'Tian Can Tu Dou',
    year: '2016'
  },
  // Mangas récents populaires
  {
    id: 'static-11',
    title: 'Spy x Family',
    description: 'Un espion, une assassin et une télépathe forment une famille fictive.',
    cover: '/images/manga-placeholder.svg',
    url: '/manga/spy-family',
    type: 'manga',
    status: 'ongoing',
    lastChapter: '90+',
    chapterCount: { french: 80, total: 90 },
    author: 'Tatsuya Endo',
    year: '2019'
  },
  {
    id: 'static-12',
    title: 'Kaiju No. 8',
    description: 'Kafka devient un kaiju dans un monde où l\'humanité combat ces monstres.',
    cover: '/images/manga-placeholder.svg',
    url: '/manga/kaiju-8',
    type: 'manga',
    status: 'ongoing',
    lastChapter: '110+',
    chapterCount: { french: 100, total: 110 },
    author: 'Naoya Matsumoto',
    year: '2020'
  },
  {
    id: 'static-13',
    title: 'Hell\'s Paradise',
    description: 'Un ninja condamné à mort cherche l\'élixir d\'immortalité sur une île mystérieuse.',
    cover: '/images/manga-placeholder.svg',
    url: '/manga/hells-paradise',
    type: 'manga',
    status: 'completed',
    lastChapter: '127',
    chapterCount: { french: 127, total: 127 },
    author: 'Yuji Kaku',
    year: '2018'
  },
  {
    id: 'static-14',
    title: 'Mashle',
    description: 'Dans un monde de magie, un garçon sans pouvoir magique utilise ses muscles.',
    cover: '/images/manga-placeholder.svg',
    url: '/manga/mashle',
    type: 'manga',
    status: 'completed',
    lastChapter: '162',
    chapterCount: { french: 162, total: 162 },
    author: 'Hajime Komoto',
    year: '2020'
  },
  {
    id: 'static-15',
    title: 'Blue Lock',
    description: 'Un programme d\'entraînement radical pour créer le meilleur attaquant du Japon.',
    cover: '/images/manga-placeholder.svg',
    url: '/manga/blue-lock',
    type: 'manga',
    status: 'ongoing',
    lastChapter: '250+',
    chapterCount: { french: 200, total: 250 },
    author: 'Muneyuki Kaneshiro',
    year: '2018'
  },
  // Mangas de différents auteurs pour tester les recommandations par auteur
  {
    id: 'static-16',
    title: 'Real',
    description: 'L\'histoire de joueurs de basketball en fauteuil roulant.',
    cover: '/images/manga-placeholder.svg',
    url: '/manga/real',
    type: 'manga',
    status: 'ongoing',
    lastChapter: '15',
    chapterCount: { french: 15, total: 15 },
    author: 'Takehiko Inoue', // Même auteur que Vagabond
    year: '1999'
  },
  {
    id: 'static-17',
    title: 'Billy Bat',
    description: 'Un dessinateur de BD découvre une conspiration historique.',
    cover: '/images/manga-placeholder.svg',
    url: '/manga/billy-bat',
    type: 'manga',
    status: 'completed',
    lastChapter: '165',
    chapterCount: { french: 165, total: 165 },
    author: 'Naoki Urasawa', // Même auteur que Monster, 20th Century Boys, Pluto
    year: '2008'
  }
];

// Fonction pour obtenir des recommandations aléatoires depuis la base statique
export function getRandomStaticRecommendations(limit: number = 5, excludeIds: string[] = []): Manga[] {
  const available = STATIC_MANGA_DATABASE.filter(manga => !excludeIds.includes(manga.id));
  const shuffled = [...available].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, limit);
}

// Fonction pour obtenir des recommandations par auteur
export function getRecommendationsByAuthor(authorName: string, limit: number = 3, excludeIds: string[] = []): Manga[] {
  return STATIC_MANGA_DATABASE
    .filter(manga => 
      manga.author?.toLowerCase().includes(authorName.toLowerCase()) && 
      !excludeIds.includes(manga.id)
    )
    .slice(0, limit);
}

// Fonction pour obtenir des recommandations par type
export function getRecommendationsByType(type: 'manga' | 'manhwa' | 'manhua', limit: number = 5, excludeIds: string[] = []): Manga[] {
  const available = STATIC_MANGA_DATABASE.filter(manga => 
    manga.type === type && !excludeIds.includes(manga.id)
  );
  const shuffled = [...available].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, limit);
}
