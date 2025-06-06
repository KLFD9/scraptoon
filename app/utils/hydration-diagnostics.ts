/**
 * Utilitaire de diagnostic pour les problèmes d'hydratation
 * Utilisé pour identifier et déboguer les différences entre serveur et client
 */

export const hydrationDiagnostics = {
  /**
   * Log les différences d'attributs HTML qui peuvent causer des problèmes d'hydratation
   */
  logAttributeDifferences: () => {
    if (typeof window === 'undefined') return;
    
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes') {
          console.warn('Hydration: Attribut modifié après hydratation:', {
            element: mutation.target,
            attribute: mutation.attributeName,
            oldValue: mutation.oldValue,
            newValue: (mutation.target as Element).getAttribute(mutation.attributeName || '')
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
      console.warn('Hydration: Extensions détectées:', foundAttributes);
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
      console.warn('Hydration: Éléments temporels détectés:', timeElements);
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
