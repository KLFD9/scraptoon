// Test du nouveau système de recommandations statiques
console.log('🧪 Test du nouveau système de recommandations...');

async function testNewRecommendationSystem() {
  console.log('🗑️ Nettoyage du cache...');
  
  // Vider le cache des recommandations
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('user_recommendations')) {
      localStorage.removeItem(key);
      console.log('Supprimé:', key);
    }
  });

  console.log('✅ Cache vidé');

  // Test 1: Recommandations sans favoris
  console.log('\n🔸 Test 1: Recommandations générales (sans favoris)');
  try {
    const response = await fetch('/api/recommendations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ limit: 5, favorites: [] })
    });

    const data = await response.json();
    console.log('✅ Réponse reçue:', data.success);
    console.log('📚 Recommandations générales:', data.results?.map(r => `${r.title} (${r.type}) par ${r.author}`));
    
    // Vérifier la diversité des types
    const types = data.results?.map(r => r.type) || [];
    const uniqueTypes = [...new Set(types)];
    console.log('🏷️ Types présents:', uniqueTypes);
    
  } catch (error) {
    console.error('❌ Erreur test 1:', error);
  }

  // Test 2: Avec favoris simulés
  console.log('\n🔸 Test 2: Recommandations avec favoris simulés');
  const testFavorites = [
    { id: 'fav1', author: 'Naoki Urasawa', type: 'manga' },
    { id: 'fav2', author: 'Takehiko Inoue', type: 'manga' }
  ];

  try {
    const response = await fetch('/api/recommendations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ limit: 5, favorites: testFavorites })
    });

    const data = await response.json();
    console.log('✅ Réponse reçue:', data.success);
    console.log('📚 Recommandations personnalisées:', data.results?.map(r => `${r.title} par ${r.author}`));
    
    // Vérifier si on a des recommandations des mêmes auteurs
    const authors = data.results?.map(r => r.author) || [];
    const hasUrasawa = authors.some(author => author?.includes('Urasawa'));
    const hasInoue = authors.some(author => author?.includes('Inoue'));
    
    console.log('🎯 Recommandations de Naoki Urasawa trouvées:', hasUrasawa);
    console.log('🎯 Recommandations de Takehiko Inoue trouvées:', hasInoue);
    
    if (hasUrasawa || hasInoue) {
      console.log('🎉 SUCCÈS: Le système de recommandations par auteur fonctionne!');
    } else {
      console.log('⚠️ Aucune recommandation par auteur trouvée');
    }
    
  } catch (error) {
    console.error('❌ Erreur test 2:', error);
  }

  // Test 3: API GET (utilisée quand pas de favoris côté client)
  console.log('\n🔸 Test 3: API GET (recommandations par défaut)');
  try {
    const response = await fetch('/api/recommendations?limit=5');
    const data = await response.json();
    console.log('✅ Réponse GET reçue:', data.success);
    console.log('📚 Recommandations GET:', data.results?.map(r => r.title));
    
  } catch (error) {
    console.error('❌ Erreur test 3:', error);
  }

  console.log('\n✨ Tests terminés');
}

// Lancer le test
if (typeof window !== 'undefined') {
  testNewRecommendationSystem();
} else {
  console.log('Test uniquement disponible dans le navigateur');
}
