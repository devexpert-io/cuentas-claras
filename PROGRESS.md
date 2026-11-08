# Progress Log

## Current Verified State

- Raíz del repositorio: `.` (la carpeta que contiene este archivo)
- Ruta estándar de arranque: `./init.sh`
- Ruta estándar de verificación: `./init.sh` (instalación con el lockfile, `pnpm typecheck` y `pnpm test`)
- Siguiente feature lista: `crear-grupo`
- Bloqueo actual: ninguno
- Última verificación: 2026-11-08, `./init.sh` con código 0 (2 tests)

## Session Log

### Session 001

- Fecha: 2026-11-08
- Objetivo: crear el harness mínimo de arranque.
- Completado: `AGENTS.md`, `init.sh`, `PROGRESS.md` y `feature_list.json` a partir de `CONTEXT.md` y `docs/`. Antes, `build-brief` dejó los documentos de discovery con las respuestas de `ejercicios/briefing.md`.
- Verificación ejecutada: `./init.sh` completo. Validación de `feature_list.json`: campos obligatorios, ids únicos, dependencias que existen y sin ciclos. `chmod +x init.sh`. Prueba de que `./init.sh` termina con código 1 si `feature_list.json` no es JSON válido o si falla un test.
- Evidencia: `./init.sh` termina con código 0 y pasan los 2 tests de `tests/cli.test.ts`. 7 features, todas `not_started`.
- Archivos actualizados: `AGENTS.md`, `init.sh`, `PROGRESS.md`, `feature_list.json`.
- Tamaño de la lista: 7 features, por debajo de las 10 que harness-starter toma como señal de alarma. Tras una segunda pasada se queda así: es una CLI local sin autenticación, roles, integraciones ni interfaz visual, y cada feature es una orden con sus reglas que se verifica con tests de dominio y de `ejecutar`. Partirlas más daría tareas sin comportamiento propio.
- Riesgos o puntos abiertos: la liquidación mínima (el método voraz no siempre da el mínimo) y las preguntas de implementación de `docs/risks-and-open-questions.md`. `reparto-desigual` está fuera del MVP según el brief y no se empieza sin confirmarlo. pnpm avisa de que ignora los scripts de esbuild: no afecta a nada.
- Siguiente paso: especificar `crear-grupo` con la skill `feature-spec`.
