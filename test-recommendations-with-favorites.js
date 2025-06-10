// Test des recommandations avec favoris
console.log('🧪 Test des recommandations avec favoris...');

const testFavorites = [
  { id: 'fav1', author: 'Eiichiro Oda', type: 'manga' },
  { id: 'fav2', author: 'Masashi Kishimoto', type: 'manga' },
  { id: 'fav3', author: 'Kohei Horikoshi', type: 'manga' }
];

async function testRecommendationsAPI() {
  try {
    console.log('📞 Test de l\'API de recommandations avec favoris...');
    
    const response = await fetch('/api/recommendations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        limit: 5,
        favorites: testFavorites
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP Error ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Réponse API recommandations:', data);
    
    if (data.success && Array.isArray(data.results)) {
      console.log('📊 Recommandations reçues:', data.results.length);
      console.log('🏷️ Titres:', data.results.map(r => r.title));
      
      // Vérifier qu'on n'a pas les favoris dans les recommandations
      const recommendedIds = data.results.map(r => r.id);
      const favoriteIds = testFavorites.map(f => f.id);
      const overlap = recommendedIds.filter(id => favoriteIds.includes(id));
      
      if (overlap.length === 0) {
        console.log('✅ Aucun favori dans les recommandations (bon!)');
      } else {
        console.log('⚠️ Favoris trouvés dans les recommandations:', overlap);
      }
      
      // Vérifier les images
      data.results.forEach(rec => {
        if (rec.cover && rec.cover.includes('manga-placeholder.svg')) {
          console.log('✅ Image placeholder correcte pour:', rec.title);
        } else if (rec.cover && rec.cover.includes('myanimelist.net')) {
          console.log('⚠️ Image externe détectée pour:', rec.title, rec.cover);
        }
      });
      
    } else {
      console.log('❌ Format de réponse invalide:', data);
    }
    
  } catch (error) {
    console.error('❌ Erreur test recommandations:', error);
    
    // Test de fallback vers API mock
    try {
      console.log('🔄 Test de l\'API mock de fallback...');
      const mockResponse = await fetch('/api/recommendations/mock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ limit: 5 }),
      });
      
      if (mockResponse.ok) {
        const mockData = await mockResponse.json();
        console.log('✅ API mock fonctionne:', mockData.results?.length || 0, 'items');
      } else {
        console.log('❌ API mock aussi en échec');
      }
    } catch (mockError) {
      console.error('❌ Erreur API mock:', mockError);
    }
  }
}

// Lancer le test
if (typeof window !== 'undefined') {
  // Dans le navigateur
  testRecommendationsAPI();
} else {
  console.log('Test uniquement disponible dans le navigateur');
}
