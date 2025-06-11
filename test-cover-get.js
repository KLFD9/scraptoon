// Test GET pour vérifier les URLs de couverture MangaDx
const testMangaDxCoversGet = async () => {
  console.log('🧪 Test GET des URLs de couverture MangaDx...\n');

  // URLs de test basées sur le résultat précédent
  const testUrls = [
    'https://uploads.mangadex.org/covers/801513ba-a712-498c-8f57-cae55b38cc92/96e4f744-bb72-4e47-9f75-635af4e7729b.512.jpg',
    'https://uploads.mangadex.org/covers/801513ba-a712-498c-8f57-cae55b38cc92/22ff2622-e93c-420f-b477-7a86eec02a1d.jpg',
    'https://uploads.mangadex.org/covers/d1a9fdeb-f713-407f-960c-8326b586e6fd/8e74a0f1-09a0-407f-9bfd-d4dc961e54e9.512.jpg',
    'https://uploads.mangadex.org/covers/d1a9fdeb-f713-407f-960c-8326b586e6fd/05f8dcb4-8ea1-48db-a0b1-3a8fbf695e5a.jpg'
  ];

  for (const [index, url] of testUrls.entries()) {
    console.log(`Test ${index + 1}: ${url.split('/').pop()}`);
    try {
      const response = await fetch(url);
      console.log(`Status: ${response.status}`);
      console.log(`Content-Type: ${response.headers.get('content-type')}`);
      console.log(`Content-Length: ${response.headers.get('content-length')}`);
      
      if (response.ok) {
        console.log('✅ URL valide!');
      } else {
        console.log('❌ URL invalide');
      }
    } catch (error) {
      console.log(`❌ Erreur: ${error.message}`);
    }
    console.log('');
  }
};

testMangaDxCoversGet();
