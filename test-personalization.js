// Test complet pour vérifier la personnalisation des recommandations
const http = require('http');

async function callAPI(postData) {
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/recommendations',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve(result);
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function testPersonalization() {
  console.log('🧪 Test de personnalisation des recommandations...\n');
  
  // Test 1: Sans favoris (recommandations aléatoires)
  console.log('📋 Test 1: Sans favoris');
  const test1Data = JSON.stringify({
    favorites: [],
    history: []
  });
  
  const result1 = await callAPI(test1Data);
  console.log(`✅ Recommandations sans favoris: ${result1.results?.length || 0} résultats`);
  if (result1.results?.length > 0) {
    console.log('   Titres:', result1.results.slice(0, 3).map(r => r.title).join(', '), '...');
  }
  
  // Test 2: Avec favoris manga (auteur Kentaro Miura)
  console.log('\n📋 Test 2: Favoris manga (Kentaro Miura)');
  const test2Data = JSON.stringify({
    favorites: [
      { id: 'berserk', author: 'Kentaro Miura', type: 'manga' }
    ],
    history: []
  });
  
  const result2 = await callAPI(test2Data);
  console.log(`✅ Recommandations avec favoris manga: ${result2.results?.length || 0} résultats`);
  if (result2.results?.length > 0) {
    console.log('   Titres:', result2.results.slice(0, 3).map(r => r.title).join(', '), '...');
    console.log('   Types:', [...new Set(result2.results.map(r => r.type))].join(', '));
  }
  
  // Test 3: Avec favoris manhwa
  console.log('\n📋 Test 3: Favoris manhwa');
  const test3Data = JSON.stringify({
    favorites: [
      { id: 'solo-leveling', author: 'Chugong', type: 'manhwa' }
    ],
    history: []
  });
  
  const result3 = await callAPI(test3Data);
  console.log(`✅ Recommandations avec favoris manhwa: ${result3.results?.length || 0} résultats`);
  if (result3.results?.length > 0) {
    console.log('   Titres:', result3.results.slice(0, 3).map(r => r.title).join(', '), '...');
    console.log('   Types:', [...new Set(result3.results.map(r => r.type))].join(', '));
  }
  
  // Test 4: Vérification que les favoris ne sont pas dans les recommandations
  console.log('\n📋 Test 4: Exclusion des favoris');
  const test4Data = JSON.stringify({
    favorites: [
      { id: 'static-1', author: 'Kentaro Miura', type: 'manga' }
    ],
    history: ['static-2']
  });
  
  const result4 = await callAPI(test4Data);
  console.log(`✅ Recommandations avec exclusions: ${result4.results?.length || 0} résultats`);
  if (result4.results?.length > 0) {
    const hasExcludedIds = result4.results.some(r => r.id === 'static-1' || r.id === 'static-2');
    console.log(`   Contient des IDs exclus: ${hasExcludedIds ? '❌ OUI' : '✅ NON'}`);
    console.log('   Premiers titres:', result4.results.slice(0, 3).map(r => r.title).join(', '));
  }
  
  console.log('\n🎉 Tests terminés !');
}

// Exécuter les tests
testPersonalization().catch(console.error);
