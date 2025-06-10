// Test pour diagnostiquer le problème de recommandations avec favoris
console.log('🔍 Diagnostic complet du système de recommandations...');

async function diagnoseFavoritesIssue() {
  // 1. Vérifier les favoris dans localStorage
  console.log('\n📚 1. Analyse des favoris stockés:');
  const favoritesData = localStorage.getItem('mangaScraper_favorites');
  if (favoritesData) {
    try {
      const favorites = JSON.parse(favoritesData);
      console.log(`✅ ${favorites.length} favoris trouvés:`);
      favorites.forEach((fav, index) => {
        console.log(`  ${index + 1}. "${fav.title}" par ${fav.author || 'Auteur inconnu'} (type: ${fav.type})`);
      });
      
      // Mapper vers le format attendu par l'API
      const mappedFavorites = favorites.map(f => {
        let contentType = 'manga';
        const langType = f.type || '';
        if (langType === 'ko') contentType = 'manhwa';
        else if (langType === 'zh' || langType === 'zh-hk') contentType = 'manhua';
        
        return {
          id: f.id,
          author: f.author,
          type: contentType
        };
      });
      
      console.log('\n🔄 Favoris mappés pour l\'API:', mappedFavorites);
      
      // 2. Tester l'API directement
      console.log('\n🔌 2. Test direct de l\'API de recommandations:');
      
      // Vider d'abord le cache pour forcer une nouvelle génération
      console.log('🗑️ Nettoyage du cache...');
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('user_recommendations')) {
          localStorage.removeItem(key);
          console.log(`  Supprimé: ${key}`);
        }
      });
      
      // Appel API avec favoris
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
      console.log('\n📄 Réponse de l\'API:', {
        success: data.success,
        count: data.results?.length || 0,
        cached: data.cached
      });
      
      if (data.results) {
        console.log('\n🎯 Recommandations reçues:');
        data.results.forEach((rec, index) => {
          console.log(`  ${index + 1}. "${rec.title}" par ${rec.author || 'Auteur inconnu'} (${rec.type})`);
        });
        
        // 3. Analyser si les recommandations sont liées aux favoris
        console.log('\n🔍 3. Analyse de la pertinence:');
        
        const favoriteAuthors = new Set(favorites.map(f => f.author).filter(Boolean));
        const recommendedAuthors = data.results.map(r => r.author).filter(Boolean);
        
        console.log('👨‍🎨 Auteurs des favoris:', Array.from(favoriteAuthors));
        console.log('👨‍🎨 Auteurs recommandés:', recommendedAuthors);
        
        // Vérifier les correspondances d'auteurs
        const authorMatches = recommendedAuthors.filter(recAuthor => 
          Array.from(favoriteAuthors).some(favAuthor => 
            recAuthor.toLowerCase().includes(favAuthor.toLowerCase()) ||
            favAuthor.toLowerCase().includes(recAuthor.toLowerCase())
          )
        );
        
        if (authorMatches.length > 0) {
          console.log('🎉 SUCCÈS: Correspondances d\'auteurs trouvées:', authorMatches);
        } else {
          console.log('⚠️ PROBLÈME: Aucune correspondance d\'auteur trouvée');
          console.log('💡 Cela suggère que la personnalisation ne fonctionne pas correctement');
        }
        
        // Vérifier les types
        const favoriteTypes = mappedFavorites.map(f => f.type);
        const recommendedTypes = data.results.map(r => r.type);
        
        console.log('🏷️ Types favoris:', favoriteTypes);
        console.log('🏷️ Types recommandés:', recommendedTypes);
        
        const typeMatches = recommendedTypes.filter(type => favoriteTypes.includes(type));
        console.log('✅ Correspondances de types:', typeMatches.length);
        
      } else {
        console.log('❌ Aucune recommandation reçue');
      }
      
    } catch (parseError) {
      console.error('❌ Erreur lors de l\'analyse des favoris:', parseError);
    }
  } else {
    console.log('⚠️ Aucun favori trouvé dans localStorage');
  }
  
  // 4. Tester sans favoris pour comparaison
  console.log('\n🆚 4. Test sans favoris (pour comparaison):');
  try {
    const response = await fetch('/api/recommendations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        limit: 5,
        favorites: []
      }),
    });

    const data = await response.json();
    console.log('📄 Recommandations générales:', data.results?.map(r => r.title) || []);
    
  } catch (error) {
    console.error('❌ Erreur test sans favoris:', error);
  }
  
  console.log('\n✨ Diagnostic terminé');
}

// Lancer le diagnostic
if (typeof window !== 'undefined') {
  diagnoseFavoritesIssue();
} else {
  console.log('Test uniquement disponible dans le navigateur');
}
