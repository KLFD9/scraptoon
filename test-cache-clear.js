// Script pour tester et vider le cache des recommandations
console.log('🧹 Test de nettoyage du cache et nouvelles recommandations...');

function clearRecommendationsCache() {
  const allKeys = Object.keys(localStorage);
  let removedCount = 0;
  
  allKeys.forEach(key => {
    if (key.startsWith('user_recommendations')) {
      localStorage.removeItem(key);
      removedCount++;
      console.log('🗑️ Supprimé:', key);
    }
  });
  
  console.log(`✅ ${removedCount} entrées de cache supprimées`);
  return removedCount;
}

async function testPersonalizedRecommendations() {
  // Vider le cache d'abord
  clearRecommendationsCache();
  
  // Récupérer les favoris du localStorage
  const favoritesData = localStorage.getItem('mangaScraper_favorites');
  let favorites = [];
  
  if (favoritesData) {
    try {
      favorites = JSON.parse(favoritesData);
      console.log('📚 Favoris trouvés:', favorites.length);
      favorites.forEach(fav => {
        console.log(`- ${fav.title} par ${fav.author} (type: ${fav.type})`);
      });
    } catch (e) {
      console.error('❌ Erreur parsing favoris:', e);
    }
  }
  
  if (favorites.length === 0) {
    console.log('⚠️ Aucun favori trouvé');
    return;
  }
  
  // Mapper les favoris vers le format attendu par l'API
  const mappedFavorites = favorites.map(f => {
    let contentType = 'manga';
    if (f.type === 'ko') contentType = 'manhwa';
    else if (f.type === 'zh' || f.type === 'zh-hk') contentType = 'manhua';
    
    return {
      id: f.id,
      author: f.author,
      type: contentType
    };
  });
  
  console.log('🎯 Favoris mappés pour l\'API:', mappedFavorites);
  
  try {
    console.log('📞 Appel API recommandations personnalisées...');
    const response = await fetch('/api/recommendations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        limit: 5,
        favorites: mappedFavorites
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP Error ${response.status}`);
    }

    const data = await response.json();
    console.log('📄 Réponse API complète:', data);
    
    if (data.success && Array.isArray(data.results)) {
      console.log('✅ Nouvelles recommandations reçues:', data.results.length);
      
      data.results.forEach((rec, index) => {
        console.log(`${index + 1}. ${rec.title} par ${rec.author || 'Auteur inconnu'} (${rec.type})`);
      });
      
      // Vérifier si ce sont toujours les mêmes recommandations mock
      const titles = data.results.map(r => r.title);
      const mockTitles = ['Dragon Ball Super', 'One Punch Man', 'My Hero Academia', 'Jujutsu Kaisen', 'Chainsaw Man'];
      const isMockData = mockTitles.every(title => titles.includes(title));
      
      if (isMockData) {
        console.log('⚠️ ATTENTION: Ce sont encore les données mock! La personnalisation ne fonctionne pas.');
      } else {
        console.log('🎉 SUCCÈS: Recommandations personnalisées reçues!');
      }
      
      // Vérifier qu'aucun favori n'est dans les recommandations
      const recommendedIds = data.results.map(r => r.id);
      const favoriteIds = favorites.map(f => f.id);
      const overlap = recommendedIds.filter(id => favoriteIds.includes(id));
      
      if (overlap.length === 0) {
        console.log('✅ Aucun favori dans les recommandations (correct)');
      } else {
        console.log('⚠️ Favoris trouvés dans les recommandations:', overlap);
      }
      
    } else {
      console.log('❌ Format de réponse invalide');
    }
    
  } catch (error) {
    console.error('❌ Erreur test recommandations:', error);
  }
}

// Lancer le test
if (typeof window !== 'undefined') {
  console.log('🚀 Lancement du test...');
  testPersonalizedRecommendations();
} else {
  console.log('Test uniquement disponible dans le navigateur');
}
