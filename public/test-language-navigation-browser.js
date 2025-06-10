/**
 * Script pour tester la navigation avec priorité de langue dans le navigateur
 * À exécuter dans la console du navigateur sur une page de lecture de chapitre
 */

console.log('🧪 Test de navigation avec priorité de langue - Mode navigateur');

// Simuler quelques chapitres pour tester
const testData = {
  allChapters: [
    { id: 'ch10fr', chapter: '10', language: 'fr', title: 'Chapitre 10 FR' },
    { id: 'ch10en', chapter: '10', language: 'en', title: 'Chapter 10 EN' },
    { id: 'ch9fr', chapter: '9', language: 'fr', title: 'Chapitre 9 FR' },
    { id: 'ch9en', chapter: '9', language: 'en', title: 'Chapter 9 EN' },
    { id: 'ch8fr', chapter: '8', language: 'fr', title: 'Chapitre 8 FR' },
    { id: 'ch7en', chapter: '7', language: 'en', title: 'Chapter 7 EN' },
    { id: 'ch6fr', chapter: '6', language: 'fr', title: 'Chapitre 6 FR' },
    { id: 'ch5fr', chapter: '5', language: 'fr', title: 'Chapitre 5 FR' },
  ]
};

// Test de la fonction de navigation (copie de la logique du hook)
function testNavigation(chapters, currentChapterId, preferredLanguage) {
  const currentIndex = chapters.findIndex(ch => ch.id === currentChapterId);
  const currentChapter = chapters[currentIndex];

  if (currentIndex === -1) {
    return { prevChapterId: null, nextChapterId: null, currentChapterIndex: -1 };
  }

  const languageToUse = preferredLanguage || currentChapter?.language;

  const findChapterByLanguage = (direction, startIndex) => {
    const increment = direction === 'next' ? 1 : -1;
    const limit = direction === 'next' ? chapters.length : -1;

    // Première passe : chercher dans la même langue
    if (languageToUse) {
      for (let i = startIndex + increment; 
           direction === 'next' ? i < limit : i > limit; 
           i += increment) {
        if (chapters[i]?.language === languageToUse) {
          return chapters[i].id;
        }
      }
    }

    // Deuxième passe : fallback
    const fallbackIndex = startIndex + increment;
    if (fallbackIndex >= 0 && fallbackIndex < chapters.length) {
      return chapters[fallbackIndex].id;
    }

    return null;
  };

  const prevChapterId = findChapterByLanguage('prev', currentIndex);
  const nextChapterId = findChapterByLanguage('next', currentIndex);

  return { 
    prevChapterId, 
    nextChapterId, 
    currentChapterIndex: currentIndex,
    currentLanguage: currentChapter?.language
  };
}

// Tests interactifs
function runInteractiveTest() {
  console.log('\\n📋 Chapitres disponibles:');
  testData.allChapters.forEach((ch, i) => {
    console.log(`${i}: ${ch.id} - Ch.${ch.chapter} (${ch.language}) - ${ch.title}`);
  });

  console.log('\\n🎮 Tests de navigation:');
  
  // Test depuis chapitre 9 français
  const test1 = testNavigation(testData.allChapters, 'ch9fr');
  console.log('\\n1️⃣ Depuis Ch9 FR:');
  console.log(`   Précédent: ${test1.prevChapterId} (attendu: ch10fr)`);
  console.log(`   Suivant: ${test1.nextChapterId} (attendu: ch8fr)`);
  console.log(`   ✅ ${test1.prevChapterId === 'ch10fr' && test1.nextChapterId === 'ch8fr' ? 'OK' : 'ERREUR'}`);

  // Test depuis chapitre 9 anglais  
  const test2 = testNavigation(testData.allChapters, 'ch9en');
  console.log('\\n2️⃣ Depuis Ch9 EN:');
  console.log(`   Précédent: ${test2.prevChapterId} (attendu: ch10en)`);
  console.log(`   Suivant: ${test2.nextChapterId} (attendu: ch7en)`);
  console.log(`   ✅ ${test2.prevChapterId === 'ch10en' && test2.nextChapterId === 'ch7en' ? 'OK' : 'ERREUR'}`);
  
  // Test depuis chapitre 8 français (pas de ch7fr)
  const test3 = testNavigation(testData.allChapters, 'ch8fr');
  console.log('\\n3️⃣ Depuis Ch8 FR (pas de Ch7 FR):');
  console.log(`   Précédent: ${test3.prevChapterId} (attendu: ch9fr)`);
  console.log(`   Suivant: ${test3.nextChapterId} (attendu: ch7en - fallback)`);
  console.log(`   ✅ ${test3.prevChapterId === 'ch9fr' && test3.nextChapterId === 'ch7en' ? 'OK' : 'ERREUR'}`);
}

// Fonction pour tester avec des données réelles si disponibles
function testWithRealData() {
  // Vérifier si on est sur une page de chapitre
  if (window.location.pathname.includes('/chapter/')) {
    console.log('\\n🔍 Tentative de test avec données réelles...');
    
    // Essayer de récupérer les données depuis le composant React (si accessible)
    const reactFiberKey = Object.keys(document.querySelector('body')).find(key => 
      key.startsWith('__reactFiber') || key.startsWith('__reactInternalInstance')
    );
    
    if (reactFiberKey) {
      console.log('✅ Composant React détecté');
      // Ici on pourrait essayer d'accéder aux props/state du composant
      // Mais c'est complexe à cause de l'encapsulation React
    } else {
      console.log('⚠️ Composant React non accessible, utilisation des données de test');
    }
  } else {
    console.log('⚠️ Pas sur une page de chapitre, utilisation des données de test');
  }
  
  runInteractiveTest();
}

// Lancer les tests
testWithRealData();

console.log('\\n💡 Conseils pour tester manuellement:');
console.log('1. Naviguez vers un manga avec plusieurs chapitres en différentes langues');
console.log('2. Ouvrez un chapitre en français');
console.log('3. Utilisez les flèches suivant/précédent');
console.log('4. Vérifiez que la navigation privilégie la langue française');
console.log('5. Testez avec un chapitre en anglais pour voir la différence');

// Export pour usage externe si besoin
window.testLanguageNavigation = {
  testNavigation,
  testData,
  runInteractiveTest
};
