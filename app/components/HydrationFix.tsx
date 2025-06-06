'use client';

import { useEffect } from 'react';

export default function HydrationFix() {
  useEffect(() => {
    // Nettoyer les attributs ajoutés par les extensions de navigateur
    // qui peuvent causer des problèmes d'hydratation
    const cleanUpBrowserExtensionAttributes = () => {
      const html = document.documentElement;
      
      // Liste des attributs courants ajoutés par les extensions
      const extensionAttributes = [
        'webcrx',
        'data-new-gr-c-s-check-loaded',
        'data-gr-ext-installed',
        'data-lt-installed',
        'spellcheck'
      ];
      
      extensionAttributes.forEach(attr => {
        if (html.hasAttribute(attr)) {
          html.removeAttribute(attr);
        }
      });
    };

    // Nettoyer immédiatement
    cleanUpBrowserExtensionAttributes();
    
    // Observer les changements d'attributs pour les nettoyer en temps réel
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.target === document.documentElement) {
          cleanUpBrowserExtensionAttributes();
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['webcrx', 'data-new-gr-c-s-check-loaded', 'data-gr-ext-installed', 'data-lt-installed']
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  return null;
}
