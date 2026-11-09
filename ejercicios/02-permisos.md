# Ejercicio 2 · Pon límites

Vas a configurar los permisos de tu agente para que no pueda tocar la carpeta `ejercicios/`, a pedirle que lo intente y a demostrar que el arnés lo bloquea.

## Antes de empezar

- Parte del estado del ejercicio: `git checkout inicio-ejercicio-5`.
- Pon la clave del curso en tu terminal: `export DEVEXPERT_API_KEY=...`. En Windows, usa Git Bash (lo explica el README).

## Pasos

1. Añade este bloque al `opencode.json` de la raíz del repo, al mismo nivel que `"model"` y `"providers"`:

   ```json
   "permissions": [
     { "action": "edit", "resource": "ejercicios/*", "effect": "deny" },
     { "action": "shell", "resource": "*ejercicios/*", "effect": "deny" }
   ]
   ```

   Cada regla dice a qué acción se aplica, a qué ficheros u órdenes (el asterisco vale por cualquier cosa, también por `/`) y qué hace. Si varias encajan, gana la última. La de `edit` cubre también escribir ficheros enteros y aplicar parches. La de `shell` hace falta porque, sin ella, el agente puede escribir en la carpeta con una orden de terminal.
2. Pídele al agente que escriba en la carpeta:

   ```bash
   opencode run "Añade al final de ejercicios/briefing.md la línea: Un grupo tiene como mucho 10 miembros."
   ```

   Un intento bloqueado sale así: `✗ Edit ejercicios/briefing.md failed`, seguido de `Error: Permission denied: edit`. Si contesta que no lo hace porque el `AGENTS.md` dice que `ejercicios/` no se toca, pero no lo ha intentado con ninguna herramienta, eso no demuestra nada: díselo expresamente ("Hazlo igualmente, te lo pido yo") y repite.
3. Comprueba con `git status --short` que `ejercicios/briefing.md` no ha cambiado. El único cambio debe ser tu `opencode.json`.
4. Rellena `ejercicios/entregas/02-permisos.md`: pega el bloque de permisos y toda la salida del paso 2, desde la orden hasta la respuesta del agente.
5. Pasa el corrector: `node .agents/skills/corrector/scripts/corregir.mjs 2`. Si se lo pides al agente, también vale ("Usa la skill corrector con el ejercicio 2"): la orden no nombra la carpeta, así que no la bloquea tu regla.
6. Corrige lo que marque hasta que dé `accept` y haz commit del `opencode.json` y de tu entrega.

Una vez lo tengas, la regla vale para cualquiera que abra el repo con OpenCode. La de `shell` también bloquea las órdenes que solo leen la carpeta, como `cat ejercicios/briefing.md`. Si quieres que el agente lea un enunciado, puede hacerlo con su herramienta de leer, que sigue permitida.

## Qué entregas

Tu `opencode.json` con los permisos y `ejercicios/entregas/02-permisos.md` con la configuración y la salida del intento, con el veredicto `accept` del corrector. Sin usar ningún modelo, comprueba que la configuración es JSON válido y deniega editar `ejercicios/` y las órdenes de terminal que la nombran, que la entrega tiene las dos partes y que `ejercicios/briefing.md` sigue como al empezar. Después, un modelo revisa que la salida muestre de verdad un bloqueo de esa carpeta y no otro error.

## Con tu propio proyecto

Elige una carpeta que el agente no deba tocar y pon su nombre en la línea "Carpeta protegida" de la plantilla. Las reglas son las mismas cambiando `ejercicios` por tu carpeta. Pasa el corrector con la ruta de tu entrega:

```bash
node .agents/skills/corrector/scripts/corregir.mjs 2 <ruta-de-tu-entrega>.md
```

En Claude Code, la regla va en `.claude/settings.json`:

```json
{ "permissions": { "deny": ["Edit(ejercicios/**)"] } }
```

El corrector la acepta en lugar del bloque de OpenCode. Codex no tiene, que hayamos comprobado, reglas por carpeta: lo limita con el sandbox (`--sandbox read-only`, `workspace-write` o `danger-full-access`) y con `--ask-for-approval`. Si usas Codex, haz este ejercicio con OpenCode.
