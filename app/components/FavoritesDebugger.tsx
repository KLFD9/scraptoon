'use client';

import { useState, useEffect } from 'react';
import { useFavorites } from '../hooks/useFavorites';

export function FavoritesDebugger() {
  const { favorites } = useFavorites();
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [testResults, setTestResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testCurrentFavorites = async () => {
    try {
      setLoading(true);
      
      // Analyser les favoris actuels
      const favoritesData = favorites.map((fav) => {
        let contentType: 'manga' | 'manhwa' | 'manhua' = 'manga';
        
        if (fav.type === 'manhwa' || fav.type === 'manhua' || fav.type === 'manga') {
          contentType = fav.type;
        } else {
          const langType = fav.type as string;
          if (langType === 'ko') contentType = 'manhwa';
          else if (langType === 'zh' || langType === 'zh-hk') contentType = 'manhua';
          else contentType = 'manga';
        }
        
        return { 
          id: fav.id, 
          title: fav.title,
          author: fav.author,
          type: contentType
        };
      });

      // Test debug
      const debugResponse = await fetch('/api/debug-favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ favorites: favoritesData })
      });
      const debugData = await debugResponse.json();
      setDebugInfo(debugData);

      // Test recommandations
      const recResponse = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: 6, favorites: favoritesData })
      });
      const recData = await recResponse.json();
      setTestResults(recData);

    } catch (error) {
      console.error('Erreur test favoris:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearCache = async () => {
    try {
      await fetch('/api/recommendations/clear-cache', { method: 'POST' });
      alert('Cache vidé !');
    } catch (error) {
      console.error('Erreur vidage cache:', error);
    }
  };

  useEffect(() => {
    if (favorites.length > 0) {
      testCurrentFavorites();
    }
  }, [favorites]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-4xl mx-auto mt-8">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">🔍 Debug Favoris & Recommandations</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Favoris actuels */}
        <div>
          <h3 className="text-lg font-semibold mb-2 text-gray-700">📚 Favoris actuels ({favorites.length})</h3>
          <div className="bg-gray-50 p-3 rounded text-sm max-h-64 overflow-y-auto">
            {favorites.length === 0 ? (
              <p className="text-gray-500">Aucun favori trouvé</p>
            ) : (
              favorites.map((fav, i) => (
                <div key={fav.id} className="mb-2 p-2 bg-white rounded">
                  <strong>{i + 1}. {fav.title}</strong>
                  <br />
                  <span className="text-gray-600">
                    Auteur: {fav.author} | Type: {fav.type}
                  </span>
                  <br />
                  <span className="text-sm text-gray-500">
                    Status lecture: {fav.readingStatus}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Analyse debug */}
        <div>
          <h3 className="text-lg font-semibold mb-2 text-gray-700">🎯 Analyse</h3>
          <div className="bg-gray-50 p-3 rounded text-sm">
            {debugInfo ? (
              <pre className="whitespace-pre-wrap">
                {JSON.stringify(debugInfo.analysis, null, 2)}
              </pre>
            ) : (
              <p className="text-gray-500">En attente d'analyse...</p>
            )}
          </div>
        </div>
      </div>

      {/* Résultats recommandations */}
      {testResults && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2 text-gray-700">
            🎯 Recommandations actuelles ({testResults.results?.length || 0})
          </h3>
          <div className="bg-gray-50 p-3 rounded">
            {testResults.success ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {testResults.results?.map((manga: any, i: number) => (
                  <div key={manga.id} className="bg-white p-3 rounded border">
                    <strong className="text-sm">{i + 1}. {manga.title}</strong>
                    <br />
                    <span className="text-xs text-gray-600">
                      {manga.author} | {manga.type}
                    </span>
                    <br />
                    <span className="text-xs text-gray-500">
                      {manga.status}
                    </span>
                  </div>
                )) || <p>Aucune recommandation</p>}
              </div>
            ) : (
              <p className="text-red-600">Erreur: {testResults.error}</p>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="mt-6 flex gap-3">
        <button
          onClick={testCurrentFavorites}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Test en cours...' : 'Retester'}
        </button>
        <button
          onClick={clearCache}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Vider le cache
        </button>
      </div>

      {/* Instructions */}
      <div className="mt-4 p-3 bg-yellow-50 rounded text-sm">
        <p><strong>Instructions:</strong></p>
        <ul className="list-disc ml-5 mt-1">
          <li>Ajoutez des manga en favoris</li>
          <li>Regardez si l'analyse détecte le contenu mature</li>
          <li>Vérifiez si les recommandations changent</li>
          <li>Si ça ne marche pas, videz le cache et retestez</li>
        </ul>
      </div>
    </div>
  );
}
