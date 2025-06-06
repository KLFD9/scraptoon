// Script pour tester les scénarios de lecture dans la console du navigateur

// Scénario 1: Vider la progression de lecture pour tester "Commencer la lecture"
console.log('=== Test Scénario 1: Nouveau manga ===');
localStorage.removeItem('reading-progress');
console.log('Progression de lecture effacée');
console.log('1. Recherchez un manga (ex: "solo")');
console.log('2. Cliquez sur un manga');
console.log('3. Vérifiez que le bouton affiche "Commencer la lecture"');
console.log('4. Cliquez sur le bouton et vérifiez qu\'il mène au chapitre 1');

// Scénario 2: Ajouter une progression de lecture factice pour tester "Continuer la lecture"
function simulateReadingProgress(mangaId, chapterId, chapterNumber) {
  const progress = [
    {
      mangaId: mangaId,
      chapterId: chapterId,
      chapterNumber: chapterNumber,
      lastRead: new Date().toISOString(),
      mangaTitle: 'Test Manga'
    }
  ];
  localStorage.setItem('reading-progress', JSON.stringify(progress));
  console.log(`Progression simulée: ${mangaTitle} - Chapitre ${chapterNumber}`);
}

console.log('\n=== Test Scénario 2: Manga avec progression ===');
console.log('Tapez dans la console:');
console.log('simulateReadingProgress("dd390a8e-1db0-48cb-b660-bceee2ef37d8", "50", "50")');
console.log('1. Puis rechargez la page du manga');
console.log('2. Vérifiez que le bouton principal affiche "Continuer chapitre 50"');
console.log('3. Vérifiez qu\'un bouton "Recommencer depuis le début" apparaît');
