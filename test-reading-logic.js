// Test de la logique de tri des chapitres
// Script pour tester la logique côté client sans navigateur

// Simulation de chapitres dans l'ordre décroissant (comme retourné par l'API)
const chapters = [
  { id: "100", chapter: "Chapitre 100", publishedAt: "2024-06-01" },
  { id: "99", chapter: "Chapitre 99", publishedAt: "2024-05-30" },
  { id: "97", chapter: "Chapitre 97", publishedAt: "2024-05-28" },
  { id: "5", chapter: "Chapitre 5", publishedAt: "2024-01-05" },
  { id: "3", chapter: "Chapitre 3", publishedAt: "2024-01-03" },
  { id: "2", chapter: "Chapitre 2", publishedAt: "2024-01-02" },
  { id: "1", chapter: "Chapitre 1", publishedAt: "2024-01-01" },
  { id: "1-duplicate", chapter: "Chapitre 1", publishedAt: "2024-01-01" },
];

// Logique de tri (identique à celle du composant)
const sortedChapters = [...chapters].sort((a, b) => {
  // Essayer de trier par numéro de chapitre extrait du titre
  const aChapterText = a.chapter || '';
  const bChapterText = b.chapter || '';
  
  // Extraire les numéros de chapitre (gérer Episode 1, Chapitre 1, etc.)
  const aNum = parseFloat(aChapterText.replace(/[^\d.]/g, ''));
  const bNum = parseFloat(bChapterText.replace(/[^\d.]/g, ''));
  
  // Si on a des numéros valides, trier par numéro
  if (!isNaN(aNum) && !isNaN(bNum)) {
    return aNum - bNum;
  }
  
  // Fallback : trier par date de publication (plus ancien en premier)
  const aDate = new Date(a.publishedAt || '1970-01-01');
  const bDate = new Date(b.publishedAt || '1970-01-01');
  return aDate.getTime() - bDate.getTime();
});

console.log('Chapitres originaux (ordre API):');
chapters.forEach(c => console.log(`  ${c.chapter} (${c.id})`));

console.log('\nChapitre après tri (pour le bouton de lecture):');
sortedChapters.forEach(c => console.log(`  ${c.chapter} (${c.id})`));

console.log('\nPremier chapitre détecté:', sortedChapters[0]);
console.log('Devrait être:', { id: "1", chapter: "Chapitre 1" });

// Test avec des épisodes (style Webtoons)
const episodes = [
  { id: "10", chapter: "Episode 10", publishedAt: "2024-01-10" },
  { id: "5", chapter: "Episode 5", publishedAt: "2024-01-05" },
  { id: "1", chapter: "Episode 1", publishedAt: "2024-01-01" },
];

const sortedEpisodes = [...episodes].sort((a, b) => {
  const aChapterText = a.chapter || '';
  const bChapterText = b.chapter || '';
  
  const aNum = parseFloat(aChapterText.replace(/[^\d.]/g, ''));
  const bNum = parseFloat(bChapterText.replace(/[^\d.]/g, ''));
  
  if (!isNaN(aNum) && !isNaN(bNum)) {
    return aNum - bNum;
  }
  
  const aDate = new Date(a.publishedAt || '1970-01-01');
  const bDate = new Date(b.publishedAt || '1970-01-01');
  return aDate.getTime() - bDate.getTime();
});

console.log('\n--- Test avec des Episodes ---');
console.log('Premier épisode détecté:', sortedEpisodes[0]);
console.log('Devrait être:', { id: "1", chapter: "Episode 1" });
