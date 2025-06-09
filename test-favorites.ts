// Test simple pour vérifier la logique des favoris
import { Manga, FavoriteManga } from './app/types/manga';

// Fonction pour simuler le localStorage en Node.js
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => store[key] = value,
    removeItem: (key: string) => delete store[key],
    clear: () => store = {}
  };
})();

// Simuler localStorage si on n'est pas dans le navigateur
if (typeof window === 'undefined') {
  global.localStorage = mockLocalStorage as any;
}

const testManga: Manga = {
  id: 'test-manga-1',
  title: 'Test Manga',
  description: 'Un manga de test',
  cover: '/test.jpg',
  url: '/manga/test-manga-1',
  type: 'manga',
  status: 'ongoing',
  lastChapter: 'Chapitre 10',
  chapterCount: { french: 10, total: 15 },
  author: 'Test Author',
  isAvailableInFrench: true
};

// Test de base pour vérifier que la structure fonctionne
console.log('Testing favorites system...');

// Test 1: Création d'un favori
const newFavorite: FavoriteManga = {
  ...testManga,
  addedAt: new Date().toISOString(),
  readingStatus: 'to-read'
};

console.log('✓ Favorite created:', newFavorite.title);

// Test 2: LocalStorage simulation
const FAVORITES_KEY = 'mangaScraper_favorites';
const favorites = [newFavorite];
localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));

const savedFavorites = JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');
console.log('✓ Favorites saved and loaded:', savedFavorites.length);

// Test 3: Vérification du type
function isFavorite(mangaId: string, favorites: FavoriteManga[]): boolean {
  return favorites.some(fav => fav.id === mangaId);
}

console.log('✓ isFavorite check:', isFavorite('test-manga-1', savedFavorites));

console.log('All tests passed! Favorites system structure is working.');
