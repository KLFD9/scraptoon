import { Source } from '@/app/types/source';
import toomicsSource from './toomics';

// Exportation de toutes les sources disponibles
export const sources: Record<string, Source> = {
  toomics: toomicsSource,
};

// Exportation individuelle des sources
export { toomicsSource };

// Fonction utilitaire pour obtenir toutes les sources
export function getAllSources(): Source[] {
  return Object.values(sources);
}

// Fonction utilitaire pour obtenir une source par son nom
export function getSource(name: string): Source | undefined {
  return sources[name];
}
