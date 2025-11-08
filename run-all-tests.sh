#!/bin/bash

# Script para ejecutar todos los tests del sistema de inventario
# Asegura que los seeders se ejecuten primero

echo "╔══════════════════════════════════════════════════════════╗"
echo "║         🧪 EJECUTOR DE TESTS DE INVENTARIO              ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Contador de tests
PASSED=0
FAILED=0
SKIPPED=0

# Función para ejecutar un test
run_test() {
    local test_name=$1
    local test_file=$2
    
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}🧪 Ejecutando: ${test_name}${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
    
    if node "$test_file" 2>&1; then
        echo -e "${GREEN}✅ PASADO: ${test_name}${NC}\n"
        ((PASSED++))
    else
        echo -e "${RED}❌ FALLADO: ${test_name}${NC}\n"
        ((FAILED++))
    fi
}

# Preguntar si ejecutar seeders primero
echo -e "${YELLOW}¿Deseas ejecutar los seeders primero? (s/n)${NC}"
read -r run_seeders

if [ "$run_seeders" = "s" ] || [ "$run_seeders" = "S" ]; then
    echo ""
    echo -e "${BLUE}🌱 Ejecutando seeders...${NC}"
    echo ""
    
    echo "📍 [1/2] Seeder de usuarios..."
    node database/seeds/users-seeder.js
    
    echo ""
    echo "📍 [2/2] Seeder de inventario..."
    node database/seeds/inventory-seeder.js
    
    echo ""
    echo -e "${GREEN}✅ Seeders completados${NC}"
    echo ""
fi

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║              EJECUTANDO SUITE DE TESTS                  ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# Tests básicos (siempre funcionan)
run_test "1. Flujo de Reserva" "tests/test-reservation-flow.js"
run_test "2. Cancelación de Orden" "tests/test-cancel-order.js"
run_test "3. Stock Insuficiente" "tests/test-insufficient-stock.js"
run_test "4. Múltiples Items" "tests/test-multiple-items.js"
run_test "5. Devolución de Items" "tests/test-return-item.js"
run_test "6. Transferencia entre Almacenes" "tests/test-warehouse-transfer.js"
run_test "7. Ajuste de Inventario" "tests/test-inventory-adjustment.js"

# Tests de consultas y reportes
run_test "8. Historial de Movimientos" "tests/test-movement-history.js"
run_test "9. Reportes y Estadísticas" "tests/test-reports-statistics.js"

# Tests de órdenes
run_test "10. Órdenes de Compra" "tests/test-purchase-orders.js"
run_test "11. Órdenes de Venta" "tests/test-sales-orders.js"

# Tests avanzados (requieren seeders)
run_test "12. Reservas Concurrentes" "tests/test-concurrent-reservations.js"
run_test "13. Permisos por Rol" "tests/test-role-permissions.js"
run_test "14. Performance y Estrés" "tests/test-performance-stress.js"
run_test "15. Integración Completa E2E" "tests/test-full-integration.js"

# Resumen final
echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║                   RESUMEN DE TESTS                       ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}✅ Tests Pasados:  $PASSED${NC}"
echo -e "${RED}❌ Tests Fallados:  $FAILED${NC}"
echo ""

TOTAL=$((PASSED + FAILED))
PERCENTAGE=$((PASSED * 100 / TOTAL))

echo "📊 Tasa de Éxito: $PERCENTAGE% ($PASSED/$TOTAL)"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 ¡TODOS LOS TESTS PASARON!${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠️  Algunos tests fallaron. Revisa los logs arriba.${NC}"
    exit 1
fi
