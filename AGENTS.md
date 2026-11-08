# Project Agent Instructions

Este repositorio contiene Cuentas claras, una CLI en TypeScript para repartir los gastos de un grupo: quién ha pagado qué, cuál es el saldo de cada miembro y qué pagos dejan las cuentas a cero.

## Read First

- `CONTEXT.md` — glosario del dominio. Usar sus términos en código, mensajes y documentos (`Miembro`, nunca "usuario").
- `docs/build-brief.md` — problema, objetivos, MVP y lo que queda fuera.
- `docs/domain-model.md` — conceptos y reglas numeradas de importes, reparto y saldos.
- `docs/risks-and-open-questions.md` — riesgos, supuestos y preguntas abiertas.

Leer solo cuando aplique:

- `docs/specs/<feature-id>.md` — contrato de la feature en la que se trabaja.
- `docs/adr/` — si llega a existir, cuando una decisión pueda contradecir otra ya aceptada.

## Startup Workflow

Antes de escribir código:

1. Confirmar el directorio con `pwd`.
2. Leer `PROGRESS.md` (estado verificado actual y siguiente paso).
3. Leer `feature_list.json` y elegir la primera feature no terminada, en el orden de la lista, cuyas dependencias estén todas en `accepted`.
4. Ejecutar `./init.sh`.
5. Si la verificación base falla, arreglar la base antes de añadir trabajo nuevo.

## Working Rules

- Una feature cada vez, con su spec en `docs/specs/` (se escribe con la skill `feature-spec`).
- No marcar una feature como terminada solo porque haya código.
- Mantener los cambios dentro del alcance de la feature salvo un arreglo mínimo imprescindible.
- No cambiar en silencio las reglas de verificación durante la implementación.
- Los importes se calculan siempre en céntimos enteros, nunca con decimales. Las reglas de `docs/domain-model.md` se prueban con tests.
- TypeScript estricto y sin dependencias de ejecución: solo Node y su biblioteca estándar.
- Las reglas de dominio van en funciones puras. La CLI se prueba a través de `ejecutar` (`src/cli.ts`), sin lanzar procesos.
- Los tests y las pruebas a mano usan una carpeta temporal en `CUENTAS_DIR`, nunca la `.cuentas/` del repo.
- Todo en español: documentos, identificadores, mensajes de la CLI y descripciones de los commits (Conventional Commits).
- `ejercicios/` es material del curso. No modificarlo salvo que se pida expresamente.
- Actualizar los artefactos del repo en lugar de depender de resúmenes del chat.

## Required Artifacts

- `feature_list.json`: fuente de verdad del estado de las features.
- `PROGRESS.md`: estado verificado actual y registro ligero de sesiones.
- `init.sh`: ruta estándar de arranque y verificación. Instala con el lockfile y ejecuta `pnpm typecheck` y `pnpm test`. No arranca procesos largos.

## Definition Of Done

Una feature está terminada solo si:

- el comportamiento objetivo está implementado,
- la verificación requerida se ha ejecutado de verdad,
- la evidencia está registrada en `feature_list.json` o `PROGRESS.md`,
- el repo sigue arrancando con `./init.sh`,
- la documentación relevante está actualizada si cambian comportamiento, reglas de dominio o verificación.

Con eso la feature pasa a `passing`. Solo pasa a `accepted` cuando la valida la skill `feature-validator` en una sesión que no escribió el código.

## End Of Session

1. Actualizar `PROGRESS.md`.
2. Actualizar `feature_list.json`.
3. Anotar riesgos o bloqueos pendientes.
4. Dejar el repo listo para que la siguiente sesión ejecute `./init.sh` directamente.
