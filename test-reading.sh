#!/bin/bash

# Script de test pour la fonction de lecture de manga
# Teste plusieurs chapitres pour vérifier la robustesse

echo "🧪 Test de la fonctionnalité de lecture de manga"
echo "=============================================="

BASE_URL="http://localhost:3001"
MANGA_ID="0aea9f43-d4a9-4bf7-bebc-550a512f9b95"

# Couleurs pour l'affichage
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction pour tester un chapitre
test_chapter() {
    local chapter_id=$1
    local chapter_name=$2
    
    echo -e "\n📖 Test du chapitre: ${YELLOW}${chapter_name}${NC}"
    echo "ID: ${chapter_id}"
    
    # Tester l'API
    response=$(curl -s "${BASE_URL}/api/manga/${MANGA_ID}/chapter/${chapter_id}")
    
    if [ $? -eq 0 ]; then
        pages_array=$(echo "$response" | jq -r '.pages[]?' 2>/dev/null)
        pages_count=$(echo "$response" | jq -r '.pages | length' 2>/dev/null)
        method=$(echo "$response" | jq -r '.scrapingMethod // "N/A"')
        
        if [ "$pages_count" != "null" ] && [ "$pages_count" -gt 0 ]; then
            echo -e "✅ ${GREEN}Succès${NC} - ${pages_count} pages récupérées (méthode: ${method})"
            
            # Tester quelques URLs d'images
            first_image=$(echo "$response" | jq -r '.pages[0] // ""' 2>/dev/null)
            if [ ! -z "$first_image" ] && [ "$first_image" != "null" ]; then
                http_status=$(curl -s -o /dev/null -w "%{http_code}" "$first_image")
                if [ "$http_status" = "200" ]; then
                    echo -e "✅ ${GREEN}Image accessible${NC} (HTTP $http_status)"
                else
                    echo -e "⚠️ ${YELLOW}Image non accessible${NC} (HTTP $http_status)"
                fi
            fi
        else
            error=$(echo "$response" | jq -r '.error // "Erreur inconnue"')
            echo -e "❌ ${RED}Échec${NC} - $error"
        fi
    else
        echo -e "❌ ${RED}Erreur de requête${NC}"
    fi
}

# Récupérer la liste des chapitres
echo "📚 Récupération de la liste des chapitres..."
chapters_response=$(curl -s "${BASE_URL}/api/manga/${MANGA_ID}/chapters?page=1")

if [ $? -eq 0 ]; then
    chapter_count=$(echo "$chapters_response" | jq -r '.chapters | length')
    echo -e "✅ ${GREEN}${chapter_count} chapitres trouvés${NC}"
    
    # Tester les 3 premiers chapitres
    echo "$chapters_response" | jq -r '.chapters[:3] | .[] | .id + "|" + (.chapter // "N/A") + "|" + (.title // "Sans titre")' | while IFS='|' read -r id chapter title; do
        test_chapter "$id" "$chapter - $title"
    done
else
    echo -e "❌ ${RED}Impossible de récupérer la liste des chapitres${NC}"
    exit 1
fi

echo -e "\n🏁 ${GREEN}Tests terminés${NC}"

# Test de la page de lecture
echo -e "\n🌐 Test de la page de lecture dans le navigateur..."
echo "URL: ${BASE_URL}/manga/${MANGA_ID}/chapter/bef14451-3d6d-4121-a166-421f5e1855aa"
echo "Ouvrez cette URL dans votre navigateur pour tester l'interface de lecture."
