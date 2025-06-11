// Test direct de l'API MangaDx
const testMangaDxAPI = async () => {
  console.log('🧪 Test direct de l\'API MangaDx...\n');

  // Test 1: Recherche basique
  try {
    console.log('1. Test recherche basique...');
    const params1 = new URLSearchParams();
    params1.append('limit', '5');
    params1.append('order[rating]', 'desc');
    params1.append('includes[]', 'cover_art');
    params1.append('includes[]', 'author');
    params1.append('contentRating[]', 'safe');
    params1.append('contentRating[]', 'suggestive');

    const url1 = `https://api.mangadex.org/manga?${params1.toString()}`;
    console.log('URL:', url1);

    const response1 = await fetch(url1, {
      headers: { Accept: 'application/json' }
    });

    console.log('Status basique:', response1.status);
    if (!response1.ok) {
      const text1 = await response1.text();
      console.log('Erreur basique:', text1.substring(0, 200));
    }
  } catch (error) {
    console.log('Erreur basique:', error.message);
  }

  // Test 2: Recherche avec contenu mature
  try {
    console.log('\n2. Test recherche contenu mature...');
    const params2 = new URLSearchParams();
    params2.append('limit', '5');
    params2.append('order[rating]', 'desc');
    params2.append('includes[]', 'cover_art');
    params2.append('includes[]', 'author');
    params2.append('contentRating[]', 'erotica');
    params2.append('contentRating[]', 'suggestive');
    
    // Tags réels MangaDx
    const matureTags = [
      '423e2eae-a7a2-4a8b-ac03-a8351462d71d', // Romance
      'b9af3a63-f058-46de-a9a0-e0c13906197a', // Drama
    ];
    matureTags.forEach(tag => params2.append('includedTags[]', tag));

    const url2 = `https://api.mangadex.org/manga?${params2.toString()}`;
    console.log('URL mature:', url2.substring(0, 100) + '...');

    const response2 = await fetch(url2, {
      headers: { Accept: 'application/json' }
    });

    console.log('Status mature:', response2.status);
    if (response2.ok) {
      const data = await response2.json();
      console.log('Résultats mature:', data.data?.length || 0);
      if (data.data && data.data.length > 0) {
        data.data.slice(0, 3).forEach((manga, i) => {
          const title = manga.attributes.title.en || 
                       manga.attributes.title.ja || 
                       Object.values(manga.attributes.title)[0];
          console.log(`${i + 1}. ${title}`);
        });
      }
    } else {
      const text2 = await response2.text();
      console.log('Erreur mature:', text2.substring(0, 200));
    }
  } catch (error) {
    console.log('Erreur mature:', error.message);
  }

  // Test 3: Vérifier si MangaDx fonctionne du tout
  try {
    console.log('\n3. Test de base MangaDx...');
    const response3 = await fetch('https://api.mangadex.org/manga?limit=1', {
      headers: { Accept: 'application/json' }
    });
    console.log('Status test base:', response3.status);
    if (response3.ok) {
      const data = await response3.json();
      console.log('MangaDx fonctionne! Premier résultat:', 
        data.data[0]?.attributes?.title?.en || 'Titre inconnu');
    }
  } catch (error) {
    console.log('MangaDx ne répond pas:', error.message);
  }
};

// Exécuter le test
testMangaDxAPI();
