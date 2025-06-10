/**
 * Utilitaire de diagnostic pour les problèmes d'hydratation
 * Utilisé pour identifier et déboguer les différences entre serveur et client
 */

import { logger } from './logger';

export const hydrationDiagnostics = {
  /**
   * Log les différences d'attributs HTML qui peuvent causer des problèmes d'hydratation
   */
  logAttributeDifferences: () => {
    if (typeof window === 'undefined') return;
    
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes') {
          logger.log('warning', 'hydration attribute changed', {
            element: mutation.target as Element,
            attribute: mutation.attributeName ?? undefined,
            oldValue: mutation.oldValue ?? undefined,
            newValue: (mutation.target as Element).getAttribute(mutation.attributeName || '') ?? undefined
          });
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeOldValue: true,
      subtree: true
    });

    return () => observer.disconnect();
  },

  /**
   * Vérifie la présence d'extensions de navigateur problématiques
   */
  checkBrowserExtensions: () => {
    if (typeof window === 'undefined') return [];
    
    const problematicAttributes = [
      'webcrx',
      'data-new-gr-c-s-check-loaded',
      'data-gr-ext-installed',
      'data-lt-installed',
      'spellcheck'
    ];

    const foundAttributes = problematicAttributes.filter(attr => 
      document.documentElement.hasAttribute(attr)
    );

    if (foundAttributes.length > 0) {
      logger.log('warning', 'browser extensions detected', {
        extensions: foundAttributes
      });
    }

    return foundAttributes;
  },

  /**
   * Vérifie les composants qui utilisent des données dépendantes du temps
   */
  checkTimeBasedComponents: () => {
    if (typeof window === 'undefined') return;
    
    // Vérifie si des éléments contiennent des timestamps qui pourraient différer
    const timeElements = document.querySelectorAll('[data-time], [data-timestamp]');
    
    if (timeElements.length > 0) {
      logger.log('warning', 'time-based elements detected', {
        elements: Array.from(timeElements).map(el => el.outerHTML?.slice(0, 50))
      });
    }
  }
};

// Auto-diagnostic en mode développement
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  setTimeout(() => {
    hydrationDiagnostics.checkBrowserExtensions();
    hydrationDiagnostics.checkTimeBasedComponents();
  }, 1000);
}
