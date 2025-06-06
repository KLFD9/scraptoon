#!/usr/bin/env node

const API_BASE = 'http://localhost:3003';

async function testChaptersSorting() {
  console.log('🧪 Test de la logique de tri et pagination des chapitres\n');
  
  // ID d'un manga MangaDex populaire (Solo Leveling)
  const mangaId = 'dd390a8e-1db0-48cb-b660-bceee2ef37d8';
  
  const sortOptions = ['chapter-asc', 'chapter-desc', 'newest', 'oldest'];
  
  for (const sort of sortOptions) {
    console.log(`📋 Test du tri: ${sort}`);
    
    try {
      const response = await fetch(`${API_BASE}/api/manga/${mangaId}/chapters?page=1&limit=5&sort=${sort}`);
      const data = await response.json();
      
      if (data.error) {
        console.log(`❌ Erreur: ${data.error}`);
        continue;
      }
      
      console.log(`✅ ${data.chapters.length} chapitres récupérés`);
      console.log(`📄 Page ${data.pagination?.currentPage}/${data.pagination?.totalPages} (${data.pagination?.totalItems} total)`);
      
      // Afficher les premiers chapitres avec leurs infos
      data.chapters.slice(0, 3).forEach((chapter, i) => {
        const flag = chapter.language ? getFlagForLanguage(chapter.language) : '🌐';
        console.log(`   ${i + 1}. Ch. ${chapter.chapter || 'N/A'} ${flag} ${chapter.language || 'unknown'} - ${chapter.title ? chapter.title.slice(0, 50) : 'Sans titre'}`);
      });
      
      console.log('');
    } catch (error) {
      console.log(`❌ Erreur de requête: ${error.message}\n`);
    }
  }
  
  // Test de pagination
  console.log('📄 Test de pagination (tri chapter-asc)');
  for (let page = 1; page <= 3; page++) {
    try {
      const response = await fetch(`${API_BASE}/api/manga/${mangaId}/chapters?page=${page}&limit=3&sort=chapter-asc`);
      const data = await response.json();
      
      if (data.error) {
        console.log(`❌ Page ${page}: ${data.error}`);
        continue;
      }
      
      console.log(`📄 Page ${page}: ${data.chapters.length} chapitres`);
      data.chapters.forEach((chapter, i) => {
        const flag = chapter.language ? getFlagForLanguage(chapter.language) : '🌐';
        console.log(`   ${(page - 1) * 3 + i + 1}. Ch. ${chapter.chapter || 'N/A'} ${flag}`);
      });
    } catch (error) {
      console.log(`❌ Erreur page ${page}: ${error.message}`);
    }
  }
}

function getFlagForLanguage(languageCode) {
  const flags = {
    'fr': '🇫🇷',
    'en': '🇺🇸',
    'ja': '🇯🇵',
    'ko': '🇰🇷',
    'zh': '🇨🇳',
    'es': '🇪🇸',
    'de': '🇩🇪',
    'it': '🇮🇹',
    'pt': '🇵🇹',
    'ru': '🇷🇺',
  };
  return flags[languageCode.toLowerCase()] || '🌐';
}

testChaptersSorting().catch(console.error);
