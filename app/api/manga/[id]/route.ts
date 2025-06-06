import { NextResponse } from 'next/server';
import { Cache } from '@/app/utils/cache';
import { retry } from '@/app/utils/retry';
import { logger } from '@/app/utils/logger';
import type {
  MangaDexAggregate,
  MangaDexChaptersResponse,
  MangaDexMangaResponse,
  MangaDexRelationship,
  MangaDexTag,
  MangaDexAggregateVolume
} from '@/app/types/mangadex';

// Mapping des genres en français
const genreTranslations: { [key: string]: string } = {
  'action': 'Action',
  'adventure': 'Aventure',
  'comedy': 'Comédie',
  'drama': 'Drame',
  'fantasy': 'Fantaisie',
  'horror': 'Horreur',
  'mystery': 'Mystère',
  'psychological': 'Psychologique',
  'romance': 'Romance',
  'sci-fi': 'Science-fiction',
  'slice of life': 'Tranche de vie',
  'sports': 'Sports',
  'supernatural': 'Surnaturel',
  'thriller': 'Thriller',
  'isekai': 'Isekai',
  'martial arts': 'Arts martiaux',
  'school life': 'Vie scolaire',
  'harem': 'Harem',
  'historical': 'Historique',
  'military': 'Militaire',
  'music': 'Musical',
  'shounen': 'Shōnen',
  'shoujo': 'Shōjo',
  'seinen': 'Seinen',
  'josei': 'Josei',
  'gore': 'Gore',
  'sexual violence': 'Violence sexuelle',
  'magic': 'Magie',
  'demons': 'Démons',
  'mecha': 'Mecha',
  'medical': 'Médical',
  'police': 'Police',
  'superhero': 'Super-héros',
  'vampire': 'Vampire',
  'yaoi': 'Yaoi',
  'yuri': 'Yuri'
};

interface MangaDetails {
  id: string;
  title: string;
  description: string;
  cover: string | null;
  author?: string;
  year?: number;
  status: string;
  type: string;
  isAvailableInFrench: boolean;
  chapterCount: {
    total: number;
    french: number;
  };
  genres: string[];
  availableLanguages: string[];
  lastChapter: string | null;
  videoUrl: string | null;
}

const mangaCache = new Cache<MangaDetails>(3600000);

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id: mangaId } = await Promise.resolve(params);

    const cached = await mangaCache.get(mangaId);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Construire les URLs de l'API MangaDex
    const mangaUrl = `https://api.mangadex.org/manga/${mangaId}?includes[]=author&includes[]=cover_art`;
    const chaptersUrl = `https://api.mangadex.org/manga/${mangaId}/feed?translatedLanguage[]=fr&translatedLanguage[]=en&limit=1&order[chapter]=desc&includes[]=scanlation_group`;
    const aggregateUrl = `https://api.mangadex.org/manga/${mangaId}/aggregate?translatedLanguage[]=fr&translatedLanguage[]=en`;

    // Récupérer les données du manga
    const [mangaResponse, chaptersResponse, aggregateResponse] = await Promise.all([
      retry(() => fetch(mangaUrl), 3, 1000),
      retry(() => fetch(chaptersUrl), 3, 1000),
      retry(() => fetch(aggregateUrl), 3, 1000)
    ]);

    if (!mangaResponse.ok) {
      return NextResponse.json({ error: 'Manga non trouvé' }, { status: 404 });
    }

    const mangaData: MangaDexMangaResponse = await mangaResponse.json();
    const chaptersData: MangaDexChaptersResponse = await chaptersResponse.json();
    const aggregateData: MangaDexAggregate = await aggregateResponse.json();

    // Extraire les informations nécessaires
    const manga = mangaData.data;
    const attributes = manga.attributes;
    const relationships = manga.relationships;

    // Trouver la couverture
    const coverRel = relationships.find(
      (rel: MangaDexRelationship) => rel.type === 'cover_art'
    );
    const coverFileName = coverRel?.attributes?.fileName || '';

    // Trouver l'auteur
    const author = relationships.find(
      (rel: MangaDexRelationship) => rel.type === 'author'
    )?.attributes?.name;

    // Calculer le nombre de chapitres et les chapitres français
    let totalChapters = 0;
    let frenchChapters = 0;

    if (aggregateData.volumes) {
      const volumes = aggregateData.volumes as Record<string, MangaDexAggregateVolume>;
      Object.values(volumes).forEach((volume) => {
        if (volume.chapters) {
          Object.values(volume.chapters).forEach((chapter) => {
            totalChapters++;
            if (chapter.translatedLanguage === 'fr') {
              frenchChapters++;
            }
          });
        }
      });
    }

    // Formater la description
    const description = attributes.description.fr || attributes.description.en || Object.values(attributes.description)[0];
    const formattedDescription = description
      ? description.replace(/\[(\w+)\]/g, '')
                  .replace(/\n+/g, '\n')
                  .trim()
      : 'Aucune description disponible.';

    // Extraire la vidéo YouTube des liens externes
    let videoUrl = null;
      if (attributes.links) {
        const youtubeLink = Object.entries(attributes.links).find(([, value]) =>
          typeof value === 'string' && (value.includes('youtube.com') || value.includes('youtu.be'))
        );
      if (youtubeLink) {
        videoUrl = youtubeLink[1];
      }
    }

    // Extraire et traduire les genres
    const genres = attributes.tags
      .filter((tag: MangaDexTag) => tag.group === 'genre')
      .map((tag: MangaDexTag) => {
        const genreName = tag.name.en.toLowerCase();
        return genreTranslations[genreName] || tag.name.fr || tag.name.en;
      });

    // Construire l'objet manga formaté
    const formattedManga: MangaDetails = {
      id: manga.id,
      title: attributes.title.fr || attributes.title.en || Object.values(attributes.title)[0],
      description: formattedDescription,
      cover: coverFileName ? `https://uploads.mangadex.org/covers/${manga.id}/${coverFileName}` : null,
      author,
      year: attributes.year,
      status: attributes.status,
      type: attributes.originalLanguage,
      isAvailableInFrench: frenchChapters > 0,
      chapterCount: {
        total: totalChapters,
        french: frenchChapters
      },
      genres,
      availableLanguages: attributes.availableTranslatedLanguages,
      lastChapter: chaptersData.data && chaptersData.data.length > 0
        ? chaptersData.data[0].attributes.chapter
        : null,
      videoUrl
    };
    await mangaCache.set(mangaId, formattedManga);
    return NextResponse.json(formattedManga);
  } catch (error) {
    logger.log('error', 'failed to fetch manga details', {
      error: String(error),
      mangaId
    });
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des détails du manga' },
      { status: 500 }
    );
  }
} 
