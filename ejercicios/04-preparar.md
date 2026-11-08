# Ejercicio 4 · Prepara el repo

Vas a preparar `cuentas-claras` para trabajar por sesiones: con `build-brief` escribes el glosario, el brief y el modelo de dominio, y con `harness-starter`, el `AGENTS.md`, el `PROGRESS.md`, la lista de features y el script de arranque.

## Antes de empezar

- Parte del estado del ejercicio: `git checkout inicio-ejercicio-4`. Ahí está la CLI vacía, con las skills del Harness Starter instaladas y sin ningún documento del proyecto.
- Pon la clave del curso en tu terminal: `export DEVEXPERT_API_KEY=...`. En Windows, usa Git Bash (lo explica el README).
- Ten a mano `ejercicios/briefing.md`: es lo que pide el grupo, y con eso vas a contestar.

## Pasos

1. Abre tu agente en la raíz del repo (`opencode`) y pídele: "Usa la skill build-brief". Te hará preguntas de una en una.
2. Contesta con lo que dice `ejercicios/briefing.md`. Si te pregunta algo que no está ahí, decide tú y díselo. Cuando te pregunte el idioma de los documentos, contesta "castellano".
3. Al terminar, revisa lo que ha escrito: `CONTEXT.md`, `docs/build-brief.md`, `docs/domain-model.md` y `docs/risks-and-open-questions.md`. Busca en `docs/domain-model.md` cada regla de la sección "Reglas" del briefing, por ejemplo la de los céntimos. Si falta alguna, pídele que la añada.
4. En la misma sesión o en otra nueva, pídele: "Usa la skill harness-starter". Crea `AGENTS.md`, `PROGRESS.md`, `feature_list.json` e `init.sh`.
5. Revisa `feature_list.json`: cada feature tiene que poder escribirse, implementarse y validarse en una sesión. Si una junta varias cosas, como "Gastos, saldos y liquidación", pídele que la divida.
6. Comprueba que arranca: `./init.sh` tiene que terminar sin errores.
7. Pasa el corrector: pídele a tu agente "Usa la skill corrector con el ejercicio 4" o ejecuta `node .agents/skills/corrector/scripts/corregir.mjs 4`. Tarda un poco, porque ejecuta `./init.sh`.
8. Corrige lo que marque hasta que dé `accept` y haz commit.

## Qué entregas

El repo con los siete ficheros y el veredicto `accept` del corrector. Sin usar ningún modelo, comprueba que están `CONTEXT.md`, `docs/build-brief.md`, `docs/domain-model.md`, `AGENTS.md`, `PROGRESS.md`, `feature_list.json` e `init.sh` (ejecutable), que `AGENTS.md` tiene menos de 100 líneas, que `feature_list.json` cumple el esquema de `harness-starter`, con dependencias que existen y sin ciclos, y que `./init.sh` termina con código 0. Después, un modelo revisa que cada feature se pueda terminar y verificar en una sesión y que las reglas del briefing estén en el modelo de dominio.

Tu lista no tiene que ser igual que la del curso. A partir del ejercicio 5 se parte de `inicio-ejercicio-5`, con la lista del curso y `crear-grupo` ya hecha.

## Con tu propio proyecto

Haz lo mismo en tu repo, contestando a `build-brief` con lo que sabes de tu producto. Copia antes `.agents/skills/` del curso (las skills del Harness Starter y el corrector) y, si usas Claude Code, enlázalas en `.claude/skills/`. Pasa el corrector igual, desde la raíz de tu repo:

```bash
node .agents/skills/corrector/scripts/corregir.mjs 4
```

Sin `ejercicios/briefing.md`, el corrector busca las reglas en `docs/build-brief.md`. Si tu proyecto no es de Node, `init.sh` tiene que ejecutar tus comprobaciones igualmente y terminar con código 0.
