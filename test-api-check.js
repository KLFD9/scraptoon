// Test simple pour vérifier l'API recommendations après suppression du fichier dupliqué
const https = require('https');
const http = require('http');

async function testAPI() {
  console.log('🧪 Test de l\'API recommendations après nettoyage...');
  
  const postData = JSON.stringify({
    favorites: [
      { id: 'fav1', author: 'Test Author', type: 'manga' },
      { id: 'fav2', author: 'Another Author', type: 'manhwa' }
    ],
    history: ['hist1', 'hist2']
  });

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
          const result = JSON.parse(data);          console.log('✅ Réponse API:', {
            status: res.statusCode,
            recommendationsCount: result.results?.length || 0,
            hasError: !!result.error,
            success: result.success
          });
          resolve(result);
        } catch (e) {
          console.log('❌ Erreur parsing JSON:', e.message);
          console.log('Raw response:', data);
          reject(e);
        }
      });
    });

    req.on('error', (e) => {
      console.log('❌ Erreur de connexion:', e.message);
      console.log('💡 Assurez-vous que le serveur Next.js est démarré avec "npm run dev"');
      reject(e);
    });

    req.write(postData);
    req.end();
  });
}

// Exécuter le test
testAPI().catch(console.error);
