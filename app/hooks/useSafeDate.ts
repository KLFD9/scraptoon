'use client';

import { useState, useEffect } from 'react';

export function useSafeDate() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const formatLastRead = (dateString: string) => {
    if (!mounted) {
      // Retourner un fallback pendant l'hydratation
      return 'Récemment';
    }

    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
      
      if (diffInHours < 1) {
        return 'Il y a quelques minutes';
      } else if (diffInHours < 24) {
        return `Il y a ${diffInHours}h`;
      } else {
        const diffInDays = Math.floor(diffInHours / 24);
        return `Il y a ${diffInDays} jour${diffInDays > 1 ? 's' : ''}`;
      }
    } catch (error) {
      return 'Récemment';
    }
  };

  return { formatLastRead, mounted };
}
