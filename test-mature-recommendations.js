// Test des recommandations avec des favoris mature
const testMatureRecommendations = async () => {
  console.log('🧪 Test des recommandations avec favoris mature...\n');

  // Simuler des favoris mature
  const matureFavorites = [
    {
      id: 'domestic-girlfriend-test',
      title: 'Domestic Girlfriend',
      author: 'Kei Sasuga',
      type: 'manga'
    },
    {
      id: 'prison-school-test', 
      title: 'Prison School',
      author: 'Akira Hiramoto',
      type: 'manga'
    }
  ];

  console.log('📋 Favoris de test:');
  matureFavorites.forEach((fav, i) => {
    console.log(`${i + 1}. ${fav.title} - ${fav.author} (${fav.type})`);
  });
  console.log('');

  try {
    const response = await fetch('http://localhost:3001/api/recommendations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        limit: 6,
        favorites: matureFavorites
      })
    });

    const data = await response.json();

    console.log('📊 Résultats:');
    console.log(`- Success: ${data.success}`);
    console.log(`- Nombre de recommandations: ${data.results?.length || 0}`);
    console.log('');

    if (data.results && data.results.length > 0) {
      console.log('🎯 Recommandations obtenues:');
      data.results.forEach((manga, i) => {
        console.log(`${i + 1}. ${manga.title}`);
        console.log(`   Auteur: ${manga.author}`);
        console.log(`   Type: ${manga.type}`);
        console.log(`   Description: ${manga.description.substring(0, 100)}...`);
        console.log('');
      });

      // Vérifier si ce sont toujours les mêmes recommandations génériques
      const genericTitles = ['One Piece', 'Attack on Titan', 'Solo Leveling'];
      const hasGenericTitles = data.results.some(manga => 
        genericTitles.includes(manga.title)
      );

      if (hasGenericTitles) {
        console.log('❌ PROBLÈME: Le système retourne encore les recommandations génériques!');
      } else {
        console.log('✅ SUCCÈS: Le système retourne des recommandations personnalisées!');
      }
    } else {
      console.log('❌ Aucune recommandation reçue');
      if (data.error) {
        console.log(`Erreur: ${data.error}`);
      }
    }

  } catch (error) {
    console.log('❌ Erreur lors du test:', error.message);
  }
};

// Exécuter le test
testMatureRecommendations();
