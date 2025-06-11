import mangaScantradSource from './mangascantrad'; // Corrected casingt { Source } from '@/app/types/source';
import toomicsSource from './toomics';
import webtoonSource from './webtoons';
import komgaSource from './komga';
import mangadexSource from './mangadex';
import { Source } from '@/app/types/source';

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
