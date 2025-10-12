#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

cd "${PROJECT_ROOT}"

echo ">>> Rebuilding What-to-Watch stack (this may take a moment)…"
sudo docker compose down
sudo docker compose up -d --build

echo ">>> Current container status:"
sudo docker compose ps

echo ">>> Tail of app logs:"
sudo docker compose logs --tail 20 app

echo ">>> Done."
