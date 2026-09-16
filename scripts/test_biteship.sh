#!/usr/bin/env bash
# ==============================================================================
# test_biteship.sh — Menguji Koneksi Langsung ke API Ekspedisi Biteship
# ==============================================================================
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$DIR/backend"

CYAN='\033[0;36m'
NC='\033[0m'
BOLD='\033[1m'

echo -e "${BOLD}${CYAN}🚚 Menjalankan tes live koneksi ke Biteship API...${NC}\n"

if [ -f "./venv/bin/python" ]; then
    ./venv/bin/python tests/test_biteship.py
elif command -v python3 &>/dev/null; then
    python3 tests/test_biteship.py
else
    python tests/test_biteship.py
fi
