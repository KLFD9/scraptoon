import { Source } from '@/app/types/source';
import toomicsSource from './toomics';
import webtoonSource from './webtoons';
import komgaSource from './komga';
import mangaScantradSource from './mangascantrad';
import mangadexSource from './mangadex';

export const sources: Record<string, Source> = {
  toomics: toomicsSource,
  webtoons: webtoonSource,
  komga: komgaSource,
  mangascantrad: mangaScantradSource,
  mangadex: mangadexSource
};

export { toomicsSource, webtoonSource, komgaSource, mangaScantradSource, mangadexSource };
import webtoonsSource from './webtoons';
import komgaSource from './komga';
import mangadexSource from './mangadex';
import mangaScantradSource from './mangaScantrad';

export const sources: Record<string, Source> = {
  toomics: toomicsSource,
  webtoons: webtoonsSource,
  komga: komgaSource,
  mangadex: mangadexSource,
  mangascantrad: mangaScantradSource,
};

export { toomicsSource, webtoonsSource, komgaSource, mangadexSource, mangaScantradSource };

export function getAllSources(): Source[] {
  return Object.values(sources);
}

export function getSource(name: string): Source | undefined {
  return sources[name];
}
