import { Source } from '@/app/types/source';
import mangaScantradSource from './mangascantrad';
import toomicsSource from './toomics';
import webtoonSource from './webtoons';
import komgaSource from './komga';
import mangadexSource from './mangadex';
import mangakakalotSource from './mangakakalot';

export const sources: Record<string, Source> = {
  toomics: toomicsSource,
  webtoons: webtoonSource,
  komga: komgaSource,
  mangascantrad: mangaScantradSource,
  mangadex: mangadexSource,
  mangakakalot: mangakakalotSource
};

export { toomicsSource, webtoonSource, komgaSource, mangaScantradSource, mangadexSource, mangakakalotSource };

export function getAllSources(): Source[] {
  return Object.values(sources);
}

export function getSource(name: string): Source | undefined {
  return sources[name];
}
