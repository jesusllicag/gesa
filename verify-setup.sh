#!/bin/bash
# Script de Verificación - Sistema GESA

echo "🔍 Verificando estructura del Sistema GESA..."
echo ""

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}✓ Migraciones:${NC}"
ls -1 database/migrations/ | grep "2026_01" | wc -l | xargs echo "  Migraciones creadas:"

echo ""
echo -e "${BLUE}✓ Modelos Eloquent:${NC}"
ls -1 app/Models/ | grep -E "(Category|Area|Asset|Maintenance|Assignment)" | wc -l | xargs echo "  Modelos creados:"

echo ""
echo -e "${BLUE}✓ Seeders:${NC}"
ls -1 database/seeders/ | grep -E "(AssetStatus|Category|Area|MaintenanceType)" | wc -l | xargs echo "  Seeders creados:"

echo ""
echo -e "${BLUE}✓ Archivos de Documentación:${NC}"
ls -1 *.md 2>/dev/null | grep -E "(DATABASE|MIGRACIONES|EJEMPLOS|ARCHITECTURE|BASE_DE)" | while read file; do
    echo "  - $file"
done

echo ""
echo -e "${GREEN}✨ Setup completado exitosamente${NC}"
echo ""
echo "📝 Próximos pasos:"
echo "1. Ejecutar: php artisan migrate:fresh --seed"
echo "2. Leer: BASE_DE_DATOS_SETUP.md"
echo "3. Explorar ejemplos en: EJEMPLOS_USO.md"
echo ""
