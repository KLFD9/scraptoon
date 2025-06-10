/**
 * Script de test pour l'API de recommandations
 * Usage: node test-recommendations.js
 */

const API_BASE = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';

async function testRecommendationsAPI() {
  console.log('🧪 Test de l\'API de recommandations...\n');

  // Test 1: API Mock GET
  console.log('1️⃣ Test API Mock (GET)...');
  try {
    const response = await fetch(`${API_BASE}/api/recommendations/mock?limit=3`);
    const data = await response.json();
    console.log('✅ API Mock GET réussie:', data.success ? `${data.results.length} items` : 'Échec');
    if (data.success) {
      console.log('   Titres:', data.results.map(r => r.title).join(', '));
    }
  } catch (error) {
    console.log('❌ API Mock GET échouée:', error.message);
  }

  // Test 2: API Mock POST
  console.log('\n2️⃣ Test API Mock (POST)...');
  try {
    const response = await fetch(`${API_BASE}/api/recommendations/mock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ limit: 3 })
    });
    const data = await response.json();
    console.log('✅ API Mock POST réussie:', data.success ? `${data.results.length} items` : 'Échec');
    if (data.success) {
      console.log('   Titres:', data.results.map(r => r.title).join(', '));
    }
  } catch (error) {
    console.log('❌ API Mock POST échouée:', error.message);
  }

  // Test 3: API principale POST
  console.log('\n3️⃣ Test API principale (POST)...');
  try {
    const response = await fetch(`${API_BASE}/api/recommendations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        limit: 3,
        favorites: [
          { id: 'one-piece', author: 'Eiichiro Oda' }
        ]
      })
    });
    const data = await response.json();
    console.log('✅ API principale POST réussie:', data.success ? `${data.results.length} items` : 'Échec');
    if (data.success) {
      console.log('   Titres:', data.results.map(r => r.title).join(', '));
      console.log('   Source:', data.source || 'non spécifiée');
    } else {
      console.log('   Erreur:', data.error);
    }
  } catch (error) {
    console.log('❌ API principale POST échouée:', error.message);
  }

  // Test 4: API principale GET
  console.log('\n4️⃣ Test API principale (GET)...');
  try {
    const response = await fetch(`${API_BASE}/api/recommendations?limit=3`);
    const data = await response.json();
    console.log('✅ API principale GET réussie:', data.success ? `${data.results.length} items` : 'Échec');
    if (data.success) {
      console.log('   Titres:', data.results.map(r => r.title).join(', '));
    }
  } catch (error) {
    console.log('❌ API principale GET échouée:', error.message);
  }

  console.log('\n🏁 Tests terminés\n');
}

// Exécuter si lancé directement
if (require.main === module) {
  testRecommendationsAPI().catch(console.error);
}

module.exports = { testRecommendationsAPI };
