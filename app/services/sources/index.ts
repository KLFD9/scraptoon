import { Source } from '@/app/types/source';
import toomicsSource from './toomics';
import webtoonSource from './webtoons';
import komgaSource from './komga';
import mangaScantradSource from './mangaScantrad'; // Corrected casing
import mangadexSource from './mangadex';

export const sources: Record<string, Source> = {
  toomics: toomicsSource,
  webtoons: webtoonSource,
  komga: komgaSource,
  mangascantrad: mangaScantradSource,
  mangadex: mangadexSource
};

export { toomicsSource, webtoonSource, komgaSource, mangaScantradSource, mangadexSource };

export function getAllSources(): Source[] {
  return Object.values(sources);
}

export function getSource(name: string): Source | undefined {
  return sources[name];
}
