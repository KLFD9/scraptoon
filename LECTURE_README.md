# Fonctionnalité de Lecture - ScraptOON

## Vue d'ensemble

La fonctionnalité de lecture permet aux utilisateurs de lire des chapitres de manga directement dans l'application. Elle comprend :

1. **Sélection de chapitre** : Navigation depuis la page du manga vers un chapitre spécifique
2. **Interface de lecture** : Affichage des pages du chapitre avec navigation
3. **Navigation entre chapitres** : Possibilité de passer au chapitre suivant/précédent

## Architecture

### Pages et composants

- **`/manga/[id]/page.tsx`** : Page de détails du manga avec liste des chapitres et bouton "Commencer la lecture"
- **`/manga/[id]/chapter/[chapterId]/page.tsx`** : Page de lecture d'un chapitre spécifique
- **`/components/ChapterReader.tsx`** : Composant qui affiche les pages du chapitre
- **`/components/ChaptersList.tsx`** : Liste des chapitres disponibles

### APIs

- **`/api/manga/[id]/chapters`** : Récupère la liste des chapitres d'un manga
- **`/api/manga/[id]/chapter/[chapterId]`** : Récupère les images d'un chapitre spécifique

## Flux utilisateur

1. **Accès depuis la page manga** :
   - L'utilisateur visite `/manga/[id]`
   - Il voit la liste des chapitres et un bouton "Commencer la lecture"
   - Le bouton "Commencer la lecture" dirige vers le premier chapitre disponible

2. **Interface de lecture** :
   - URL : `/manga/[id]/chapter/[chapterId]`
   - Affichage des pages du chapitre en défilement vertical
   - Header avec titre du manga et navigation
   - Footer avec navigation entre chapitres

3. **Navigation** :
   - Boutons précédent/suivant dans le header
   - Boutons de navigation dans le footer
   - Retour à la liste des chapitres possible

## Fonctionnalités implémentées

### ✅ Complétées
- [x] Bouton "Commencer la lecture" fonctionnel
- [x] Page de lecture avec composant ChapterReader
- [x] Navigation entre chapitres (précédent/suivant)
- [x] Interface responsive pour mobile et desktop
- [x] Récupération automatique du premier chapitre
- [x] Gestion des erreurs et états de chargement

### 🔄 En cours / À améliorer
- [ ] Sauvegarde de la progression de lecture
- [ ] Signets/bookmarks sur des pages spécifiques
- [ ] Mode plein écran
- [ ] Zoom sur les images
- [ ] Lecture en mode horizontal (pour les manhwa)

## Structure des données

### ChapterData (API Response)
```typescript
interface ChapterData {
  title: string;           // Titre du chapitre
  chapter: string;         // Numéro du chapitre
  language: string;        // Langue
  mangaTitle: string;      // Titre du manga
  pageCount: number;       // Nombre de pages
  pages: string[];         // URLs des images
  source: string;          // Source du scraping
  scrapingTime: string;    // Temps de scraping
}
```

## Notes techniques

1. **Images avec proxy** : Les images passent par un proxy (wsrv.nl) pour éviter les problèmes CORS
2. **Navigation intelligente** : Le système récupère la liste complète des chapitres pour permettre une navigation fluide
3. **Responsive design** : L'interface s'adapte aux écrans mobiles et desktop
4. **Lazy loading** : Les images sont chargées de manière optimisée

## Comment tester

1. Démarrer l'application : `npm run dev`
2. Rechercher un manga sur la page d'accueil
3. Cliquer sur un manga pour voir ses détails
4. Utiliser le bouton "Commencer la lecture" dans la sidebar
5. Naviguer entre les pages et chapitres

## Améliorations futures

1. **Sauvegarde de progression** : Mémoriser la dernière page lue
2. **Signets** : Permettre de marquer des pages importantes
3. **Paramètres de lecture** : Ajuster la taille, le mode d'affichage
4. **Statistiques** : Temps de lecture, chapitres lus, etc.
5. **Synchronisation** : Synchroniser la progression entre appareils
