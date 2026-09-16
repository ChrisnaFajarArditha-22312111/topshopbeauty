#!/usr/bin/env bash
# ==============================================================================
# test_endpoints.sh — Menjalankan Test Otomatis ke Seluruh 100 Endpoint API
# ==============================================================================
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$DIR/backend"

CYAN='\033[0;36m'
NC='\033[0m'
BOLD='\033[1m'

echo -e "${BOLD}${CYAN}🧪 Menjalankan pengujian 100 endpoint API Topshop Kosmetik...${NC}\n"

if [ -f "./venv/bin/python" ]; then
    ./venv/bin/python tests/tests_all_endpoints.py
elif command -v python3 &>/dev/null; then
    python3 tests/tests_all_endpoints.py
else
    python tests/tests_all_endpoints.py
fi
