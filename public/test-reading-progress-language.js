// Test rapide dans la console du navigateur pour vérifier la progression de lecture avec langues

// Simuler une lecture avec langue
const mockProgress = {
  mangaId: 'dd390a8e-1db0-48cb-b660-bceee2ef37d8',
  chapterId: 'test-chapter-1',
  chapterNumber: '1',
  mangaTitle: 'Solo Leveling',
  mangaCover: '/images/default-cover.svg',
  language: 'fr',
  lastReadAt: new Date().toISOString()
};

// Ajouter à la progression de lecture
const existingProgress = JSON.parse(localStorage.getItem('readingProgress') || '[]');
const updatedProgress = [mockProgress, ...existingProgress.filter(p => p.mangaId !== mockProgress.mangaId)];
localStorage.setItem('readingProgress', JSON.stringify(updatedProgress));

console.log('✅ Progression de lecture avec langue ajoutée');
console.log('🔄 Rechargez la page pour voir la section "Continuer la lecture" avec le drapeau');

// Afficher l'état actuel
console.log('📊 État actuel:', updatedProgress);
