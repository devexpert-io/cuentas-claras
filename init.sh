#!/usr/bin/env bash
# Ruta estándar de arranque y verificación del repo.
# Ejecuta comprobaciones que terminan solas y se para en cuanto una falla.
# No arranca procesos largos.
set -euo pipefail

cd "$(dirname "$0")"

echo "Repositorio: $(pwd)"

if ! command -v pnpm >/dev/null 2>&1; then
  echo "Falta pnpm. Instálalo (por ejemplo, con 'corepack enable pnpm') y vuelve a ejecutar ./init.sh." >&2
  exit 1
fi

echo "Instalando dependencias con el lockfile..."
pnpm install --frozen-lockfile
echo "Si pnpm avisa de que ha ignorado los scripts de esbuild, es normal: no hace falta aprobarlos."

echo "Comprobando que feature_list.json es JSON válido..."
node -e 'JSON.parse(require("node:fs").readFileSync("feature_list.json", "utf8"))'

echo "Comprobando tipos..."
pnpm typecheck

echo "Ejecutando tests..."
pnpm test

echo "Verificación base correcta."
echo "Para probar la CLI a mano: pnpm cuentas ayuda"
