/**
 * Utilitaires pour la gestion des langues et drapeaux
 */

export function getLanguageFlag(languageCode?: string): string {
  if (!languageCode) return '🌐';
  
  const flags: Record<string, string> = {
    'en': '🇬🇧',
    'fr': '🇫🇷', 
    'es': '🇪🇸',
    'de': '🇩🇪',
    'it': '🇮🇹',
    'pt': '🇵🇹',
    'ja': '🇯🇵',
    'ko': '🇰🇷',
    'zh': '🇨🇳',
    'ru': '🇷🇺',
    'ar': '🇸🇦',
    'nl': '🇳🇱',
    'pl': '🇵🇱',
    'tr': '🇹🇷',
    'sv': '🇸🇪',
    'da': '🇩🇰',
    'no': '🇳🇴',
    'fi': '🇫🇮',
    'el': '🇬🇷',
    'he': '🇮🇱',
    'th': '🇹🇭',
    'vi': '🇻🇳',
    'id': '🇮🇩',
    'ms': '🇲🇾',
    'hi': '🇮🇳',
    'bn': '🇧🇩',
    'uk': '🇺🇦',
    'cs': '🇨🇿',
    'sk': '🇸🇰',
    'hu': '🇭🇺',
    'ro': '🇷🇴',
    'bg': '🇧🇬',
    'hr': '🇭🇷',
    'sr': '🇷🇸',
    'sl': '🇸🇮',
    'et': '🇪🇪',
    'lv': '🇱🇻',
    'lt': '🇱🇹',
    'is': '🇮🇸',
    'mt': '🇲🇹',
    'cy': '🏴󠁧󠁢󠁷󠁬󠁳󠁿',
    'ga': '🇮🇪',
    'ca': '🇪🇸', // Catalogne (Espagne)
    'eu': '🇪🇸', // Basque (Espagne)
    'gl': '🇪🇸', // Galicien (Espagne)
  };
  
  return flags[languageCode.toLowerCase()] || '🌐';
}

export function getLanguageName(languageCode?: string): string {
  if (!languageCode) return 'Langue inconnue';
  
  const names: Record<string, string> = {
    'en': 'Anglais',
    'fr': 'Français',
    'es': 'Espagnol',
    'de': 'Allemand',
    'it': 'Italien',
    'pt': 'Portugais',
    'ja': 'Japonais',
    'ko': 'Coréen',
    'zh': 'Chinois',
    'ru': 'Russe',
    'ar': 'Arabe',
    'nl': 'Néerlandais',
    'pl': 'Polonais',
    'tr': 'Turc',
    'sv': 'Suédois',
    'da': 'Danois',
    'no': 'Norvégien',
    'fi': 'Finnois',
    'el': 'Grec',
    'he': 'Hébreu',
    'th': 'Thaï',
    'vi': 'Vietnamien',
    'id': 'Indonésien',
    'ms': 'Malais',
    'hi': 'Hindi',
    'bn': 'Bengali',
    'uk': 'Ukrainien',
    'cs': 'Tchèque',
    'sk': 'Slovaque',
    'hu': 'Hongrois',
    'ro': 'Roumain',
    'bg': 'Bulgare',
    'hr': 'Croate',
    'sr': 'Serbe',
    'sl': 'Slovène',
    'et': 'Estonien',
    'lv': 'Letton',
    'lt': 'Lituanien',
    'is': 'Islandais',
    'mt': 'Maltais',
    'cy': 'Gallois',
    'ga': 'Irlandais',
    'ca': 'Catalan',
    'eu': 'Basque',
    'gl': 'Galicien',
  };
  
  return names[languageCode.toLowerCase()] || languageCode.toUpperCase();
}

/**
 * Formate l'affichage d'une langue avec son drapeau et son nom
 */
export function formatLanguageDisplay(languageCode?: string, showName: boolean = false): string {
  const flag = getLanguageFlag(languageCode);
  if (!showName) return flag;
  
  const name = getLanguageName(languageCode);
  return `${flag} ${name}`;
}
