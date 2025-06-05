import { NextResponse } from 'next/server';
import { withErrorHandling } from '@/app/utils/errorHandler';
import { httpRequest } from '@/app/utils/httpClient';

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

export const GET = withErrorHandling(async (
  request: Request,
  { params }: { params: { id: string } }
) => {
  try {
    const { id: mangaId } = await Promise.resolve(params);

    // Construire les URLs de l'API MangaDex
    const mangaUrl = `https://api.mangadex.org/manga/${mangaId}?includes[]=author&includes[]=cover_art`;
    const chaptersUrl = `https://api.mangadex.org/manga/${mangaId}/feed?translatedLanguage[]=fr&translatedLanguage[]=en&limit=1&order[chapter]=desc&includes[]=scanlation_group`;
    const aggregateUrl = `https://api.mangadex.org/manga/${mangaId}/aggregate?translatedLanguage[]=fr&translatedLanguage[]=en`;

    // Récupérer les données du manga
    const [mangaResponse, chaptersResponse, aggregateResponse] = await Promise.all([
      httpRequest(mangaUrl, undefined, 'mangadex'),
      httpRequest(chaptersUrl, undefined, 'mangadex'),
      httpRequest(aggregateUrl, undefined, 'mangadex')
    ]);

    if (!mangaResponse.ok) {
      return NextResponse.json({ error: 'Manga non trouvé' }, { status: 404 });
    }

    const mangaData = await mangaResponse.json();
    const chaptersData = await chaptersResponse.json();
    const aggregateData = await aggregateResponse.json();

    // Extraire les informations nécessaires
    const manga = mangaData.data;
    const attributes = manga.attributes;
    const relationships = manga.relationships;

    // Trouver la couverture
    const coverRel = relationships.find((rel: any) => rel.type === 'cover_art');
    const coverFileName = coverRel?.attributes?.fileName || '';

    // Trouver l'auteur
    const author = relationships.find((rel: any) => rel.type === 'author')?.attributes?.name;

    // Calculer le nombre de chapitres et les chapitres français
    let totalChapters = 0;
    let frenchChapters = 0;

    if (aggregateData.volumes) {
      Object.values(aggregateData.volumes).forEach((volume: any) => {
        if (volume.chapters) {
          Object.values(volume.chapters).forEach((chapter: any) => {
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
      const youtubeLink = Object.entries(attributes.links).find(([key, value]) => 
        typeof value === 'string' && (value.includes('youtube.com') || value.includes('youtu.be'))
      );
      if (youtubeLink) {
        videoUrl = youtubeLink[1];
      }
    }

    // Extraire et traduire les genres
    const genres = attributes.tags
      .filter((tag: any) => tag.group === 'genre')
      .map((tag: any) => {
        const genreName = tag.name.en.toLowerCase();
        return genreTranslations[genreName] || tag.name.fr || tag.name.en;
      });

    // Construire l'objet manga formaté
    const formattedManga = {
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

    return NextResponse.json(formattedManga);
  } catch (error) {
    console.error('Erreur lors de la récupération des détails du manga:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des détails du manga' },
      { status: 500 }
    );
  }
});
