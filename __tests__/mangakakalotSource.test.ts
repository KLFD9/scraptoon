import { describe, it, expect, afterEach, vi } from 'vitest';

process.env.MANGAKAKALOT_URL = 'https://mangakakalot.com';

const mockUndici = (fetchImpl: any) => {
  vi.doMock('undici', () => ({
    Agent: class {},
    fetch: fetchImpl,
    setGlobalDispatcher: vi.fn()
  }));
};

const searchHtml = `
<div class="story_item">
  <h3 class="story_name"><a href="/manga/abc123">My Hero Academia</a></h3>
</div>`;

const chaptersHtml = `
<div id="chapterlist">
  <a href="/chapter/abc123-1"><span class="chapter-name">Chapter 1</span></a><span class="chapter-time">Jan 1, 2020</span>
  <a href="/chapter/abc123-2"><span class="chapter-name">Chapter 2</span></a><span class="chapter-time">Jan 2, 2020</span>
</div>`;

describe('mangakakalotSource', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('search parses first result', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, text: async () => searchHtml });
    mockUndici(fetchMock);
    const mod = await import('../app/services/sources/mangakakalot');
    const source = mod.default;
    const result = await source.search('My Hero');
    expect(fetchMock).toHaveBeenCalled();
    expect(result).toEqual({ titleId: 'abc123', url: 'https://mangakakalot.com/manga/abc123' });
  });

  it('getChapters parses chapters list', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, text: async () => chaptersHtml });
    mockUndici(fetchMock);
    const mod = await import('../app/services/sources/mangakakalot');
    const source = mod.default;
    const res = await source.getChapters('abc123', 'https://mangakakalot.com/manga/abc123');
    expect(fetchMock).toHaveBeenCalled();
    expect(res.chapters).toHaveLength(2);
    expect(res.source.name).toBe('mangakakalot');
  });
});
