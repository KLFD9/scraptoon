// Test pour diagnostiquer le mapping des types de favoris
// Usage: node test-favorites-mapping.js

const testFavorites = [
  { id: 'test1', title: 'One Piece', type: 'ja', author: 'Eiichiro Oda' },
  { id: 'test2', title: 'Solo Leveling', type: 'ko', author: 'Chugong' },
  { id: 'test3', title: 'Tales of Demons and Gods', type: 'zh', author: 'Mad Snail' }
];

console.log('=== TEST MAPPING DES TYPES ===');

// Test du mapping côté client (comme dans useRecommendations.ts)
const mappedFavorites = testFavorites.map((f) => {
  let contentType = 'manga';
  const langType = f.type;
  if (langType === 'ko') contentType = 'manhwa';
  else if (langType === 'zh' || langType === 'zh-hk') contentType = 'manhua';
  else contentType = 'manga'; // ja ou autres -> manga
  
  return { 
    id: f.id, 
    author: f.author,
    type: contentType
  };
});

console.log('Favoris originaux:', JSON.stringify(testFavorites, null, 2));
console.log('Favoris mappés:', JSON.stringify(mappedFavorites, null, 2));

// Test du calcul du type dominant
const favoriteTypes = mappedFavorites.map(f => f.type).filter(Boolean);
console.log('Types extraits:', favoriteTypes);

if (favoriteTypes.length > 0) {
  const typeCount = favoriteTypes.reduce((acc, type) => {
    if (type) acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});
  
  console.log('Comptage des types:', typeCount);
  
  const dominantType = Object.keys(typeCount).reduce((a, b) => 
    typeCount[a] > typeCount[b] ? a : b
  );
  
  console.log('Type dominant:', dominantType);
}

console.log('=== TEST API AVEC CES FAVORIS ===');

const testApiCall = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/recommendations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        limit: 6,
        favorites: mappedFavorites
      })
    });
    
    if (!response.ok) {
      console.error('Erreur API:', response.status, response.statusText);
      return;
    }
    
    const data = await response.json();
    console.log('Réponse API:', JSON.stringify(data, null, 2));
    
    if (data.results) {
      console.log('Titres recommandés:');
      data.results.forEach((manga, index) => {
        console.log(`${index + 1}. ${manga.title} (${manga.type}) - ${manga.author || 'Auteur inconnu'}`);
      });
    }
    
  } catch (error) {
    console.error('Erreur lors de l\'appel API:', error);
  }
};

// Décommenter pour tester l'API (nécessite que le serveur soit lancé)
// testApiCall();
