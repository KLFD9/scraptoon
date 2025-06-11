'use client';

import { useState } from 'react';
import { RecommendationsService } from '../services/recommendationsService';

export default function RecommendationsDebugger() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');

  const testRecommendations = async () => {
    setLoading(true);
    setResult('Test en cours...');
    
    try {
      // Test avec des favoris simulés (contenu mature)
      const matureFavorites = [
        { id: 'test-1', author: 'Test Author', type: 'manga' as const },
        { id: 'test-2', author: 'Test Author 2', type: 'manhwa' as const }
      ];
      
      const response = await RecommendationsService.getRecommendations({
        limit: 5,
        favorites: matureFavorites
      });
      
      if (response.success) {
        setResult(`✅ Succès! ${response.results.length} recommandations reçues:\n${response.results.map(r => `- ${r.title} (${r.type})`).join('\n')}`);
      } else {
        setResult(`❌ Erreur: ${response.error}`);
      }
    } catch (error) {
      setResult(`🚨 Exception: ${String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const clearCache = async () => {
    setLoading(true);
    try {
      await RecommendationsService.clearCache();
      setResult('🗑️ Cache vidé avec succès');
    } catch (error) {
      setResult(`❌ Erreur vidage cache: ${String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 space-y-4">
      <h3 className="text-white font-medium">🔧 Debug Recommandations</h3>
      
      <div className="flex gap-2">
        <button
          onClick={testRecommendations}
          disabled={loading}
          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-500 disabled:opacity-50"
        >
          {loading ? 'Test...' : 'Tester API'}
        </button>
        
        <button
          onClick={clearCache}
          disabled={loading}
          className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-500 disabled:opacity-50"
        >
          Vider Cache
        </button>
      </div>
      
      {result && (
        <pre className="bg-gray-900 p-2 rounded text-xs text-gray-300 whitespace-pre-wrap overflow-auto max-h-40">
          {result}
        </pre>
      )}
    </div>
  );
}
