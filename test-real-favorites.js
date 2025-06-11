// Test pour simuler les favoris réels depuis localStorage
const testRealFavorites = async () => {
  console.log('🧪 Test avec favoris réels simulés...\n');

  // Simuler des favoris réels avec du contenu mature
  const realFavorites = [
    {
      id: 'test-mature-manga-1',
      title: 'Domestic na Kanojo',
      author: 'Kei Sasuga',
      type: 'manga',
      cover: '/images/manga-placeholder.svg',
      url: '/manga/domestic-girlfriend',
      description: 'Romance dramatique entre étudiants et professeurs.',
      status: 'completed',
      lastChapter: '276',
      chapterCount: { french: 276, total: 276 },
      year: '2014',
      addedAt: new Date().toISOString(),
      readingStatus: 'completed',
      lastRead: new Date().toISOString(),
      progress: { currentChapter: 276, totalChapters: 276 }
    },
    {
      id: 'test-mature-manga-2', 
      title: 'Prison School',
      author: 'Akira Hiramoto',
      type: 'manga',
      cover: '/images/manga-placeholder.svg',
      url: '/manga/prison-school',
      description: 'Comédie et romance dans un lycée strict.',
      status: 'completed',
      lastChapter: '277',
      chapterCount: { french: 277, total: 277 },
      year: '2011',
      addedAt: new Date().toISOString(),
      readingStatus: 'completed',
      lastRead: new Date().toISOString(),
      progress: { currentChapter: 277, totalChapters: 277 }
    }
  ];

  console.log('📋 Favoris réels simulés:');
  realFavorites.forEach((fav, i) => {
    console.log(`${i + 1}. ${fav.title} - ${fav.author} (${fav.type})`);
    console.log(`   Status: ${fav.readingStatus}, Progress: ${fav.progress.currentChapter}/${fav.progress.totalChapters}`);
  });
  console.log('');

  // Test 1: Vérifier comment le hook transforme ces favoris
  console.log('=== Transformation des favoris par useRecommendations ===');
  const transformedFavorites = realFavorites.map((fav) => {
    // Même logique que dans useRecommendations
    let contentType = 'manga';
    
    // Utiliser le type existant du favori s'il est défini
    if (fav.type === 'manhwa' || fav.type === 'manhua' || fav.type === 'manga') {
      contentType = fav.type;
    } else {
      // Fallback basé sur d'autres critères
      const langType = fav.type;
      if (langType === 'ko') contentType = 'manhwa';
      else if (langType === 'zh' || langType === 'zh-hk') contentType = 'manhua';
      else contentType = 'manga';
    }
    
    return { 
      id: fav.id, 
      title: fav.title,
      author: fav.author,
      type: contentType
    };
  });

  console.log('Favoris transformés:');
  transformedFavorites.forEach((fav, i) => {
    console.log(`${i + 1}. ${fav.title} (${fav.type})`);
  });
  console.log('');

  // Test 2: Envoyer à l'API de debug
  console.log('=== Test debug des favoris ===');
  try {
    const debugResponse = await fetch('http://localhost:3001/api/debug-favorites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ favorites: transformedFavorites })
    });
    
    const debugData = await debugResponse.json();
    console.log('Analyse debug:', JSON.stringify(debugData.analysis, null, 2));
  } catch (error) {
    console.log('Erreur debug:', error.message);
  }

  // Test 3: Envoyer à l'API de recommandations
  console.log('\n=== Test recommandations avec favoris réels ===');
  try {
    const recResponse = await fetch('http://localhost:3001/api/recommendations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        limit: 6, 
        favorites: transformedFavorites 
      })
    });
    
    const recData = await recResponse.json();
    console.log('Succès:', recData.success);
    console.log('Nombre de recommandations:', recData.results?.length || 0);
    
    if (recData.results) {
      console.log('\n🎯 Recommandations reçues:');
      recData.results.forEach((manga, i) => {
        console.log(`${i + 1}. ${manga.title} - ${manga.author}`);
        console.log(`   Type: ${manga.type}, Status: ${manga.status}`);
      });
      
      // Vérifier s'il y a encore les recommandations génériques
      const genericTitles = ['One Piece', 'Attack on Titan', 'Solo Leveling'];
      const hasGeneric = recData.results.some(manga => genericTitles.includes(manga.title));
      
      if (hasGeneric) {
        console.log('\n❌ PROBLÈME: Recommandations génériques détectées!');
      } else {
        console.log('\n✅ SUCCÈS: Recommandations personnalisées!');
      }
    }
    
    if (recData.error) {
      console.log('Erreur API:', recData.error);
    }
  } catch (error) {
    console.log('Erreur recommandations:', error.message);
  }
};

testRealFavorites();
