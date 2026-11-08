# Progress Log

## Current Verified State

- Raíz del repositorio: `.` (la carpeta que contiene este archivo)
- Ruta estándar de arranque: `./init.sh`
- Ruta estándar de verificación: `./init.sh` (instalación con el lockfile, `pnpm typecheck` y `pnpm test`)
- Siguiente feature lista: `anotar-gasto`, con su spec en `docs/specs/anotar-gasto.md` y sin implementar. `crear-grupo` está `accepted`.
- Bloqueo actual: ninguno
- Última verificación: 2026-11-08, `./init.sh` con código 0 (44 tests)

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

### Session 002

- Fecha: 2026-11-08
- Objetivo: especificar e implementar `crear-grupo`.
- Completado: spec en `docs/specs/crear-grupo.md`. Orden `pnpm cuentas grupo crear "<nombre>" --miembros Ana,Bea,Carlos` con reglas puras en `src/dominio/grupo.ts`, ficheros en `src/almacen.ts`, lectura de opciones en `src/argumentos.ts` y tabla de órdenes con ayuda generada en `src/cli.ts`. Nuevo `ARCHITECTURE.md`. Actualizados `AGENTS.md`, `docs/domain-model.md` (reglas 3 y 11) y `docs/risks-and-open-questions.md`.
- Verificación ejecutada: `./init.sh` completo y prueba a mano con `pnpm cuentas` y `CUENTAS_DIR` en una carpeta temporal.
- Evidencia: `./init.sh` termina con código 0, con 44 tests en 4 ficheros. Detalle en `feature_list.json`.
- Archivos actualizados: `src/`, `tests/`, `docs/specs/crear-grupo.md`, `ARCHITECTURE.md`, `AGENTS.md`, `docs/domain-model.md`, `docs/risks-and-open-questions.md`, `feature_list.json`, `PROGRESS.md`.
- Decisiones: los nombres no distinguen mayúsculas, tildes, espacios ni signos. Cada grupo va en `<clave del nombre>.json` y crearlo nunca sobrescribe otro. Sin máximo de miembros. No hay E2E: `main.ts` solo conecta `ejecutar` con la terminal y la prueba a mano cubre esa conexión.
- Riesgos o puntos abiertos: el fichero del grupo todavía no tiene gastos ni pagos. Las features que los añadan tienen que aceptar los ficheros creados antes.
- Siguiente paso: validar `crear-grupo` con la skill `feature-validator` en una sesión nueva.

### Session 003

- Fecha: 2026-11-08
- Objetivo: validar `crear-grupo` en una sesión que no escribió el código, con `feature-validator`.
- Veredicto: **accept**. Sin hallazgos críticos ni altos.
- Verificación ejecutada: `./init.sh` con código 0 (44 tests en 4 ficheros). Revisión del diff de `feat: crear-grupo` contra `docs/specs/crear-grupo.md`: se queda dentro del alcance y no adelanta trabajo de otras features. Prueba a mano con `CUENTAS_DIR` en una carpeta temporal: escenario 1 (mensaje exacto, código 0 y `piso-lavapies.json`), escenario 7 (`piso lavapies` rechazado como grupo existente, código 1) y escenario 9 (`../fuera` se guarda como `fuera.json` dentro de la carpeta de datos).
- Archivos actualizados: `feature_list.json` (`crear-grupo` pasa a `accepted`) y `PROGRESS.md`.
- Siguiente paso: especificar `anotar-gasto` con la skill `feature-spec` (ejercicio 5).

### Session 004

- Fecha: 2026-11-08
- Objetivo: especificar `anotar-gasto` con la skill `feature-spec` (ejercicio 5).
- Completado: spec en `docs/specs/anotar-gasto.md` con 14 escenarios. Decisiones: el grupo se indica por su nombre, el importe se escribe con coma o punto y como mucho dos decimales, los céntimos sobrantes van por orden alfabético sin mayúsculas ni tildes aunque pague otro, la confirmación muestra la parte de cada participante y cada gasto tiene un `id` entero que no se reutiliza.
- Verificación ejecutada: corrector del ejercicio 5 (`node .agents/skills/corrector/scripts/corregir.mjs 5`).
- Evidencia: veredicto `accept`, sin escenarios marcados ni huecos de cobertura. Al principio marcó que ningún escenario decía cuánto le toca a cada uno: se añadieron los escenarios 1 (10,00 € entre tres que paga Carlos: 3,34 €, 3,33 € y 3,33 €) y 2 (céntimos sobrantes con tildes y mayúsculas).
- Archivos actualizados: `docs/specs/anotar-gasto.md`, `PROGRESS.md`.
- Siguiente paso: implementar `anotar-gasto` en una sesión nueva siguiendo su spec (ejercicio 6).
