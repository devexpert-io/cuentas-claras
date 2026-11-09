# Ejercicio 0 · Primer contacto

Vas a dejar tu entorno listo para el curso: abrir el agente en el repo de `cuentas-claras`, pedirle que te explique el proyecto y hacer tu primer commit.

## Antes de empezar

- Necesitas una terminal, git, Node 22 o superior, pnpm y OpenCode 2. Si te falta pnpm, instálalo con `npm install -g pnpm@latest`.
- Instala OpenCode 2 con `npm install -g @opencode/cli` (tienes otras formas en [opencode.ai/v2/docs](https://opencode.ai/v2/docs)). Comprueba con `opencode --version` que es la 2.
- Clona el repo y ponte en el punto de partida: `git checkout inicio-ejercicio-0`.
- Pon la clave del curso en tu terminal, sin pegarla en ningún fichero: `export DEVEXPERT_API_KEY=...`. Solo vale para el modelo `chat`, tiene un tope de 3 $ y dura 30 días.
- OpenCode 2 deja un servicio en segundo plano que se queda con las variables de la terminal en la que arrancó. Si lo habías abierto antes de poner la clave y te dice que falta, reinícialo con `opencode service restart` desde la terminal que la tiene.

## Pasos

1. Instala las dependencias y pasa los tests: `pnpm install` y `pnpm test`.
2. Abre OpenCode en la raíz del repo con `opencode`. El `opencode.json` del repo ya trae el proveedor DevExpert Inference y el modelo `chat`, así que no hay que configurar nada más.
3. Pídele: "Explícame qué hace este proyecto y cómo está organizado." Lee la respuesta y comprueba algo de lo que dice abriendo tú el fichero.
4. Crea `ejercicios/entregas/00-hola.md` con una línea con tu nombre y haz tu primer commit: `git add ejercicios/entregas/00-hola.md` y `git commit -m "docs: mi primer commit"`.
5. Pasa el corrector: pídele a tu agente "Usa la skill corrector con el ejercicio 0" o ejecuta `node .agents/skills/corrector/scripts/corregir.mjs 0`.

## Qué entregas

Tu primer commit después de `inicio-ejercicio-0` y el veredicto `accept` del corrector. Comprueba, sin usar ningún modelo para corregir, que tienes Node 22 o superior y pnpm, que tu clave funciona con el modelo `chat`, que `pnpm test` pasa y que hay al menos un commit tuyo después de la etiqueta.

## Si usas Claude Code o Codex

Puedes seguir el curso con ellos. Ábrelos en la raíz del repo y haz los mismos pasos. Necesitas igualmente la clave del curso en `DEVEXPERT_API_KEY`, porque el corrector la usa. La skill `corrector` está en `.agents/skills/` (Codex y OpenCode) y enlazada en `.claude/skills/` (Claude Code). Las demos de los vídeos son con OpenCode y el modelo `chat`: con otro agente o modelo las respuestas serán distintas.
