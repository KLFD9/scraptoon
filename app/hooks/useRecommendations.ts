import { useState, useEffect, useCallback } from 'react';
import type { Manga } from '../types/manga';

const CACHE_KEY = 'user_recommendations';
const CACHE_EXPIRY = `${CACHE_KEY}_expiry`;

export function useRecommendations(limit: number = 6) {
  const [recommendations, setRecommendations] = useState<Manga[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);  const fetchRecommendations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching mock recommendations from API...');
      
      try {
        // Utiliser notre endpoint mock API
        const resp = await fetch(`/api/recommendations/mock?limit=${limit}`, { 
          credentials: 'include',
          cache: 'no-cache' // Éviter la mise en cache par le navigateur
        });
        
        if (!resp.ok) {
          throw new Error(`HTTP Error ${resp.status}`);
        }
        
        const data = await resp.json();
        console.log('Mock API response:', data);
        
        if (data.success) {
          setRecommendations(data.results);
          console.log('Recommendations set from API:', data.results);
        } else {
          throw new Error(data.error || 'API error');
        }
      } catch (apiError) {
        console.warn('API fetch failed, using fallback data:', apiError);
        
        // Données mockées en dur comme fallback
        const mockData: Manga[] = [
          {
            id: '1',
            title: 'Dragon Ball',
            description: 'L\'histoire de Son Goku',
            cover: 'https://cdn.myanimelist.net/images/manga/2/209843.jpg',
            url: '/manga/dragon-ball',
            type: 'manga',
            status: 'completed',
            lastChapter: '519',
            chapterCount: { french: 519, total: 519 },
            author: 'Akira Toriyama'
          },
          {
            id: '2',
            title: 'One Piece',
            description: 'L\'aventure de Monkey D. Luffy',
            cover: 'https://cdn.myanimelist.net/images/manga/3/55539.jpg',
            url: '/manga/one-piece',
            type: 'manga',
            status: 'ongoing',
            lastChapter: '1115',
            chapterCount: { french: 1100, total: 1115 },
            author: 'Eiichiro Oda'
          },
          {
            id: '3',
            title: 'Naruto',
            description: 'L\'histoire d\'un jeune ninja',
            cover: 'https://cdn.myanimelist.net/images/manga/3/117681.jpg',
            url: '/manga/naruto',
            type: 'manga',
            status: 'completed',
            lastChapter: '700',
            chapterCount: { french: 700, total: 700 },
            author: 'Masashi Kishimoto'
          },
          {
            id: '4',
            title: 'Demon Slayer',
            description: 'Tanjiro devient un chasseur de démons',
            cover: 'https://cdn.myanimelist.net/images/manga/3/179023.jpg',
            url: '/manga/demon-slayer',
            type: 'manga',
            status: 'completed',
            lastChapter: '205',
            chapterCount: { french: 205, total: 205 },
            author: 'Koyoharu Gotouge'
          },
          {
            id: '5',
            title: 'My Hero Academia',
            description: 'Dans un monde de super-héros',
            cover: 'https://cdn.myanimelist.net/images/manga/1/209370.jpg',
            url: '/manga/my-hero-academia',
            type: 'manga',
            status: 'ongoing',
            lastChapter: '422',
            chapterCount: { french: 410, total: 422 },
            author: 'Kohei Horikoshi'
          }
        ];
        
        // Utiliser les données mockées en cas d'échec de l'API
        console.log('Using fallback mock recommendations:', mockData);
        setRecommendations(mockData.slice(0, limit));
      }
    } catch (err) {
      console.error('Error with recommendations:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }, [limit]);

  const refetch = useCallback(() => {
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(CACHE_EXPIRY);
    fetchRecommendations();
  }, [fetchRecommendations]);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  return { recommendations, loading, error, refetch };
}
