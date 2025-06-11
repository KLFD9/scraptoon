// Test pour vérifier les URLs de couverture MangaDx
const testMangaDxCovers = async () => {
  console.log('🧪 Test des URLs de couverture MangaDx...\n');

  try {
    // Récupérer quelques mangas avec cover_art
    const params = new URLSearchParams();
    params.append('limit', '3');
    params.append('includes[]', 'cover_art');
    params.append('includes[]', 'author');
    params.append('order[rating]', 'desc');

    const response = await fetch(`https://api.mangadex.org/manga?${params.toString()}`, {
      headers: { Accept: 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    
    console.log(`Trouvé ${data.data.length} mangas:\n`);

    for (const manga of data.data) {
      const title = manga.attributes.title.en || manga.attributes.title.ja || Object.values(manga.attributes.title)[0];
      
      // Trouver la cover art
      const coverRelation = manga.relationships?.find(rel => rel.type === 'cover_art');
      
      if (coverRelation) {
        // Version 1: Avec l'ID + .512.jpg
        const coverUrl1 = `https://uploads.mangadex.org/covers/${manga.id}/${coverRelation.id}.512.jpg`;
        
        // Version 2: Avec fileName si disponible
        const fileName = coverRelation.attributes?.fileName;
        const coverUrl2 = fileName ? `https://uploads.mangadex.org/covers/${manga.id}/${fileName}` : null;
        
        console.log(`📖 ${title}:`);
        console.log(`   Manga ID: ${manga.id}`);
        console.log(`   Cover ID: ${coverRelation.id}`);
        console.log(`   FileName: ${fileName || 'Non disponible'}`);
        console.log(`   URL 1 (ID.512.jpg): ${coverUrl1}`);
        if (coverUrl2) {
          console.log(`   URL 2 (fileName): ${coverUrl2}`);
        }
        
        // Tester si l'URL fonctionne
        try {
          const testResponse = await fetch(coverUrl1, { method: 'HEAD' });
          console.log(`   ✅ URL 1 Status: ${testResponse.status}`);
        } catch (err) {
          console.log(`   ❌ URL 1 Error: ${err.message}`);
        }
        
        if (coverUrl2) {
          try {
            const testResponse2 = await fetch(coverUrl2, { method: 'HEAD' });
            console.log(`   ✅ URL 2 Status: ${testResponse2.status}`);
          } catch (err) {
            console.log(`   ❌ URL 2 Error: ${err.message}`);
          }
        }
        
        console.log('');
      } else {
        console.log(`📖 ${title}: Pas de couverture trouvée\n`);
      }
    }

  } catch (error) {
    console.log('❌ Erreur:', error.message);
  }
};

testMangaDxCovers();
