// Test script pour vérifier les URLs de chapitres
// Ce script peut être utilisé pour tester manuellement les configurations

const testConfigurations = [
  {
    name: 'webtoons-test',
    testUrl: 'https://www.webtoons.com/en/fantasy/tower-of-god/list?title_no=95',
    chapterUrl: 'https://www.webtoons.com/en/fantasy/tower-of-god/season-1-ep-1/viewer?title_no=95&episode_no=1',
    selectors: {
      container: '#_imageList, .viewer_lst, .img_viewer',
      images: [
        '#_imageList img',
        '.viewer_lst img',
        '.img_viewer img',
        'img[data-url]',
        '.viewer_img img'
      ]
    }
  },
  {
    name: 'mangadex-test',
    testUrl: 'https://mangadex.org/',
    // MangaDex utilise une API, pas de scraping direct
  },
  {
    name: 'generic-manga-reader',
    selectors: {
      container: '.reading-content, .chapter-content, .manga-reader, .pages',
      images: [
        '.reading-content img',
        '.chapter-content img',
        '.manga-reader img',
        '.pages img',
        'img[data-src]',
        'img[src*="uploads"]'
      ]
    }
  }
];

export { testConfigurations };
