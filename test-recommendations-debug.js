// Test détaillé des recommandations avec logs
const testRecommendationsWithLogs = async () => {
  console.log('🧪 Test détaillé des recommandations...\n');

  // Test sans favoris d'abord
  console.log('=== TEST 1: Sans favoris ===');
  try {
    const response1 = await fetch('http://localhost:3001/api/recommendations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ limit: 3, favorites: [] })
    });
    const data1 = await response1.json();
    console.log('Succès:', data1.success);
    console.log('Nombre:', data1.results?.length || 0);
    if (data1.results) {
      data1.results.forEach((manga, i) => {
        console.log(`${i + 1}. ${manga.title} (${manga.id})`);
      });
    }
  } catch (error) {
    console.log('Erreur:', error.message);
  }

  console.log('\n=== TEST 2: Avec favoris mature ===');
  // Test avec favoris mature
  const matureFavorites = [
    {
      id: 'test-mature-1',
      title: 'Domestic na Kanojo', // Titre en japonais
      author: 'Kei Sasuga',
      type: 'manga'
    },
    {
      id: 'test-romance-1', 
      title: 'Prison School',
      author: 'Akira Hiramoto',
      type: 'manga'
    }
  ];

  try {
    const response2 = await fetch('http://localhost:3001/api/recommendations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ limit: 4, favorites: matureFavorites })
    });
    const data2 = await response2.json();
    console.log('Succès:', data2.success);
    console.log('Nombre:', data2.results?.length || 0);
    if (data2.results) {
      data2.results.forEach((manga, i) => {
        console.log(`${i + 1}. ${manga.title} - ${manga.author} (${manga.id})`);
      });
    }
    if (data2.error) {
      console.log('Erreur API:', data2.error);
    }
  } catch (error) {
    console.log('Erreur:', error.message);
  }

  console.log('\n=== TEST 3: API MangaDex directe avec contenu mature ===');
  // Test direct de l'API pour voir ce qu'elle retourne
  try {
    const params = new URLSearchParams();
    params.append('limit', '3');
    params.append('order[rating]', 'desc');
    params.append('includes[]', 'cover_art');
    params.append('includes[]', 'author');
    params.append('contentRating[]', 'erotica');
    params.append('contentRating[]', 'suggestive');
    
    // Tags Romance et Drama
    params.append('includedTags[]', '423e2eae-a7a2-4a8b-ac03-a8351462d71d'); // Romance
    params.append('includedTags[]', 'b9af3a63-f058-46de-a9a0-e0c13906197a'); // Drama

    const url = `https://api.mangadex.org/manga?${params.toString()}`;
    const response3 = await fetch(url, {
      headers: { Accept: 'application/json' }
    });

    if (response3.ok) {
      const data3 = await response3.json();
      console.log('API MangaDx répond avec', data3.data?.length || 0, 'résultats:');
      data3.data?.slice(0, 3).forEach((manga, i) => {
        const title = manga.attributes.title.en || 
                     manga.attributes.title.ja || 
                     Object.values(manga.attributes.title)[0];
        console.log(`${i + 1}. ${title} (${manga.id})`);
      });
    } else {
      console.log('API MangaDx erreur:', response3.status);
    }
  } catch (error) {
    console.log('Erreur API MangaDx:', error.message);
  }
};

testRecommendationsWithLogs();
