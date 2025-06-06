/**
 * Script de test pour valider la logique de navigation avec priorité de langue
 * Exécuter avec : node test-language-navigation.js
 */

// Simuler le hook useChapterNavigation 
function useChapterNavigation(chapters, currentChapterId, preferredLanguage) {
  const currentIndex = chapters.findIndex(ch => ch.id === currentChapterId);
  const currentChapter = chapters[currentIndex];

  if (currentIndex === -1) {
    return { prevChapterId: null, nextChapterId: null, currentChapterIndex: -1 };
  }

  // Déterminer la langue à privilégier : celle du chapitre actuel ou celle passée en paramètre
  const languageToUse = preferredLanguage || currentChapter?.language;

  // Fonction pour trouver le chapitre suivant/précédent en privilégiant la langue
  const findChapterByLanguage = (direction, startIndex) => {
    // Dans notre array trié par numéro décroissant :
    // - "next" (chapitre suivant) = index plus grand (numéro plus petit)  
    // - "prev" (chapitre précédent) = index plus petit (numéro plus grand)
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

    // Deuxième passe : si aucun chapitre dans la même langue, prendre le premier disponible
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

// Données de test
const testChapters = [
  { id: 'ch10fr', chapter: '10', language: 'fr', title: 'Chapitre 10 FR' },
  { id: 'ch10en', chapter: '10', language: 'en', title: 'Chapter 10 EN' },
  { id: 'ch9fr', chapter: '9', language: 'fr', title: 'Chapitre 9 FR' },
  { id: 'ch9en', chapter: '9', language: 'en', title: 'Chapter 9 EN' },
  { id: 'ch8fr', chapter: '8', language: 'fr', title: 'Chapitre 8 FR' },
  { id: 'ch7en', chapter: '7', language: 'en', title: 'Chapter 7 EN' }, // Pas de version FR
  { id: 'ch6fr', chapter: '6', language: 'fr', title: 'Chapitre 6 FR' },
  { id: 'ch5ja', chapter: '5', language: 'ja', title: 'Chapter 5 JA' }, // Langue différente
  { id: 'ch4fr', chapter: '4', language: 'fr', title: 'Chapitre 4 FR' },
  { id: 'ch3fr', chapter: '3', language: 'fr', title: 'Chapitre 3 FR' },
  { id: 'ch2fr', chapter: '2', language: 'fr', title: 'Chapitre 2 FR' },
  { id: 'ch1fr', chapter: '1', language: 'fr', title: 'Chapitre 1 FR' },
  { id: 'ch1en', chapter: '1', language: 'en', title: 'Chapter 1 EN' }
];

function runTest(description, currentChapterId, expectedPrev, expectedNext) {
  console.log(`\\n=== ${description} ===`);
  const result = useChapterNavigation(testChapters, currentChapterId);
  
  console.log(`Chapitre actuel: ${currentChapterId} (${result.currentLanguage})`);
  console.log(`Précédent trouvé: ${result.prevChapterId} (attendu: ${expectedPrev})`);
  console.log(`Suivant trouvé: ${result.nextChapterId} (attendu: ${expectedNext})`);
  
  const prevMatch = result.prevChapterId === expectedPrev;
  const nextMatch = result.nextChapterId === expectedNext;
  
  console.log(`✅ Précédent: ${prevMatch ? 'OK' : 'ERREUR'}`);
  console.log(`✅ Suivant: ${nextMatch ? 'OK' : 'ERREUR'}`);
  
  return prevMatch && nextMatch;
}

console.log('🧪 Test de la logique de navigation avec priorité de langue\\n');

// Tests de base - priorité de langue
let allTestsPassed = true;

// Test 1: Lecture en français, chapitre suivant disponible en français
allTestsPassed &= runTest(
  'Ch9 FR → doit aller vers Ch8 FR (chapitre suivant dans la même langue)',
  'ch9fr',
  'ch10fr', // Précédent = numéro plus grand = Ch10 FR
  'ch8fr'   // Suivant = numéro plus petit = Ch8 FR
);

// Test 2: Lecture en anglais, chapitre suivant disponible en anglais  
allTestsPassed &= runTest(
  'Ch9 EN → doit aller vers Ch7 EN (pas de Ch8 EN)',
  'ch9en',
  'ch10en', // Précédent = Ch10 EN
  'ch7en'   // Suivant = Ch7 EN (pas de ch8en)
);

// Test 3: Lecture en français, chapitre suivant pas disponible en français
allTestsPassed &= runTest(
  'Ch8 FR → privilégie Ch6 FR (même langue) plutôt que Ch7 EN',
  'ch8fr',
  'ch9fr',  // Précédent = Ch9 FR
  'ch6fr'   // Suivant = Ch6 FR (privilégie la même langue)
);

// Test 4: Premier chapitre français (mais il y a ch1en)
allTestsPassed &= runTest(
  'Ch1 FR → Ch1 EN existe, donc suivant = Ch1 EN',
  'ch1fr',
  'ch2fr',  // Précédent = Ch2 FR
  'ch1en'   // Suivant = Ch1 EN (même numéro, langue différente)
);

// Test 5: Dernier chapitre (début de liste)
allTestsPassed &= runTest(
  'Ch10 FR → pas de précédent',
  'ch10fr',
  null,     // Précédent = null (début de liste)
  'ch9fr'   // Suivant = Ch9 FR
);

// Test 6: Langue rare (japonais)
allTestsPassed &= runTest(
  'Ch5 JA → fallback vers chapitres disponibles',
  'ch5ja',
  'ch6fr',  // Précédent = Ch6 FR
  'ch4fr'   // Suivant = Ch4 FR
);

// Test 7: Vraie fin de liste
allTestsPassed &= runTest(
  'Ch1 EN → vraiment pas de suivant, précédent = Ch7 EN (même langue)',
  'ch1en',
  'ch7en',  // Précédent = Ch7 EN (privilégie l'anglais, pas Ch1 FR)
  null      // Suivant = null (vraie fin de liste)
);

console.log(`\\n${'='.repeat(50)}`);
if (allTestsPassed) {
  console.log('🎉 Tous les tests sont passés !');
} else {
  console.log('❌ Certains tests ont échoué');
}
console.log(`${'='.repeat(50)}\\n`);

// Test d'affichage des chapitres pour debug
console.log('📋 Liste des chapitres (ordre dans l\'array):');
testChapters.forEach((ch, index) => {
  console.log(`${index}: ${ch.id} - Ch.${ch.chapter} (${ch.language})`);
});
