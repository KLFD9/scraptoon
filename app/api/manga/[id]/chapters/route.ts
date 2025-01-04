import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Validation des paramètres
    if (!params.id) {
      return NextResponse.json(
        { error: 'ID du manga manquant' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10')));
    const language = searchParams.get('language');
    const offset = (page - 1) * limit;

    // Construire l'URL de l'API MangaDex
    let chaptersUrl = `https://api.mangadex.org/manga/${params.id}/feed?limit=${limit}&offset=${offset}&order[chapter]=desc&includes[]=scanlation_group`;
    
    if (language) {
      if (!['fr', 'en'].includes(language)) {
        return NextResponse.json(
          { error: 'Langue non supportée. Utilisez "fr" ou "en".' },
          { status: 400 }
        );
      }
      chaptersUrl += `&translatedLanguage[]=${language}`;
    } else {
      chaptersUrl += '&translatedLanguage[]=fr&translatedLanguage[]=en';
    }

    const response = await fetch(chaptersUrl);
    const data = await response.json();

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'Manga non trouvé sur MangaDex' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: `Erreur MangaDex: ${data.errors?.[0]?.detail || 'Erreur inconnue'}` },
        { status: response.status }
      );
    }

    if (!data.data || !Array.isArray(data.data)) {
      return NextResponse.json(
        { error: 'Format de réponse MangaDex invalide' },
        { status: 500 }
      );
    }

    // Formater les chapitres avec vérification des données
    const chapters = data.data.map((chapter: any) => ({
      id: chapter.id,
      chapter: chapter.attributes?.chapter || 'N/A',
      title: chapter.attributes?.title || 'Sans titre',
      language: chapter.attributes?.translatedLanguage || 'N/A',
      pages: chapter.attributes?.pages || 0,
      publishedAt: chapter.attributes?.publishAt || null,
      readableAt: chapter.attributes?.readableAt || null,
      group: chapter.relationships?.find((rel: any) => rel.type === 'scanlation_group')?.attributes?.name || 'Inconnu',
      externalUrl: `https://mangadex.org/chapter/${chapter.id}`
    }));

    return NextResponse.json({
      chapters,
      total: data.total || chapters.length,
      limit,
      offset,
      currentPage: page,
      totalPages: Math.ceil((data.total || chapters.length) / limit)
    });

  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Erreur serveur lors de la récupération des chapitres',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
} 