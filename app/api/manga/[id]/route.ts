import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = await params.id;
    
    // Construire l'URL de l'API MangaDex
    const mangaUrl = `https://api.mangadex.org/manga/${id}`;
    const coverUrl = `https://api.mangadex.org/cover?manga[]=${id}&limit=1`;
    const chaptersUrl = `https://api.mangadex.org/manga/${id}/feed?translatedLanguage[]=fr&translatedLanguage[]=en&limit=1`;

    // Récupérer les données du manga
    const [mangaResponse, coverResponse, chaptersResponse] = await Promise.all([
      fetch(mangaUrl),
      fetch(coverUrl),
      fetch(chaptersUrl)
    ]);

    if (!mangaResponse.ok) {
      return NextResponse.json({ error: 'Manga non trouvé' }, { status: 404 });
    }

    const mangaData = await mangaResponse.json();
    const coverData = await coverResponse.json();
    const chaptersData = await chaptersResponse.json();

    // Extraire les informations nécessaires
    const manga = mangaData.data;
    const attributes = manga.attributes;
    const relationships = manga.relationships;

    // Trouver la couverture
    let coverFileName = '';
    if (coverData.data && coverData.data.length > 0) {
      coverFileName = coverData.data[0].attributes.fileName;
    } else {
      // Chercher dans les relations si la couverture n'est pas trouvée via l'API cover
      const coverRel = relationships.find((rel: any) => rel.type === 'cover_art');
      if (coverRel && coverRel.attributes) {
        coverFileName = coverRel.attributes.fileName;
      }
    }

    // Trouver l'auteur
    const author = relationships.find((rel: any) => rel.type === 'author')?.attributes?.name;

    // Calculer le nombre de chapitres et les chapitres français
    const aggregateUrl = `https://api.mangadex.org/manga/${id}/aggregate`;
    const aggregateResponse = await fetch(aggregateUrl);
    const aggregateData = await aggregateResponse.json();
    
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
      ? description.replace(/\[(\w+)\]/g, '') // Supprimer les balises [url], etc.
                                .replace(/\n+/g, '\n') // Normaliser les sauts de ligne
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
      genres: attributes.tags
        .filter((tag: any) => tag.group === 'genre')
        .map((tag: any) => tag.name.fr || tag.name.en),
      availableLanguages: attributes.availableTranslatedLanguages,
      lastChapter: chaptersData.total > 0 ? chaptersData.data[0].attributes.chapter : null,
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
} 