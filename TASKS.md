# Liste des tâches

## API Rate Limiting
- [ ] Ajouter des limiteurs de taux pour éviter la surcharge des sources
- [ ] Implémenter un système de queue pour les requêtes

## Gestion d'erreurs améliorée
- [ ] Créer un middleware global de gestion d'erreurs
- [ ] Ajouter des retry policies intelligentes avec backoff exponentiel

## Optimisation des performances
- [ ] Implémenter la pagination côté serveur
- [ ] Ajouter le lazy loading pour les images de chapitres
- [ ] Optimiser les requêtes Puppeteer avec des pools de connexions

## Correctifs TypeScript
- [ ] Supprimer le fichier vide `app/hooks/useFavorites.ts` et s'assurer que les imports utilisent `useFavorites.tsx`
- [ ] Ajouter les annotations de type manquantes dans `app/favorites/page.tsx`
- [ ] Typer correctement l'accès au dictionnaire `statusOrder` avec `ReadingStatus`
- [ ] Vérifier les autres fichiers pour éviter les imports erronés de `useFavorites`
