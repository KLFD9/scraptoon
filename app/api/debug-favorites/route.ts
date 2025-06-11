import { NextResponse } from 'next/server';

export async function GET() {
  try {
    return NextResponse.json({ 
      success: true, 
      message: 'Test endpoint pour déboguer les favoris',
      instructions: 'Utilisez POST avec des favoris en JSON pour tester' 
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Erreur lors du test' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { favorites } = await request.json();
    
    console.log('🔍 FAVORIS REÇUS:', JSON.stringify(favorites, null, 2));
    
    // Analyser les favoris
    const analysis = {
      count: favorites?.length || 0,
      titles: favorites?.map((f: any) => f.title || f.id).slice(0, 5) || [],
      types: favorites?.map((f: any) => f.type).filter(Boolean) || [],
      authors: favorites?.map((f: any) => f.author).filter(Boolean).slice(0, 3) || [],
      hasMatureContent: favorites?.some((f: any) => {
        const title = (f.title || f.id || '').toLowerCase();
        const matureKeywords = ['ecchi', 'mature', 'adult', 'romance', 'hentai', 'sexy', 'charme', 'sensual', 'prison', 'domestic', 'monster'];
        return matureKeywords.some(keyword => title.includes(keyword));
      }) || false
    };
    
    return NextResponse.json({ 
      success: true, 
      received: favorites,
      analysis
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Erreur lors de l\'analyse des favoris' },
      { status: 500 }
    );
  }
}
