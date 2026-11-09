# Ejercicio 3 · Conecta un MCP de documentación

Vas a conectar a tu agente un MCP con la documentación de las librerías y a usarlo para resolver una duda sobre una librería del proyecto, sabiendo de dónde sale la respuesta.

## Antes de empezar

- Parte del estado del ejercicio: `git checkout inicio-ejercicio-5`.
- Pon la clave del curso en tu terminal: `export DEVEXPERT_API_KEY=...`. En Windows, usa Git Bash (lo explica el README).
- Vas a usar Context7 (`https://mcp.context7.com/mcp`), que no pide cuenta ni clave.

## Pasos

1. Añade este bloque al `opencode.json` de la raíz del repo, al mismo nivel que `"model"` y `"providers"`:

   ```json
   "mcp": {
     "servers": {
       "context7": { "type": "remote", "url": "https://mcp.context7.com/mcp" }
     }
   }
   ```

2. Comprueba que conecta: `opencode mcp list` tiene que decir `✓ context7  connected`. OpenCode tarda unos segundos en leer el cambio: si dice `No MCP servers configured`, espera un poco y repite.
3. Elige una duda sobre una librería del proyecto. Mira cuáles son en `package.json`: Vitest para los tests, TypeScript y tsx. Por ejemplo, cómo comprobar en Vitest que una función lanza un error con un mensaje concreto, o para qué sirve `satisfies` en TypeScript.
4. Pregúntasela al agente, pidiéndole que use la versión del proyecto y que cite la fuente:

   ```bash
   opencode run "¿Cómo compruebo en Vitest que una función lanza un error con un mensaje concreto? Mira la versión de Vitest en package.json, usa la documentación de esa versión y cita la URL de la fuente."
   ```

   Mira en la salida que llama a las herramientas del MCP. OpenCode 2 las llama desde código, así que salen dentro de una línea `execute`, como `tools.context7["resolve-library-id"](...)` y `tools.context7["query-docs"](...)`. Si no las usa, pídeselo expresamente.
5. Abre la URL que cita y comprueba que dice lo que te ha contado.
6. Rellena `ejercicios/entregas/03-mcp.md`: la configuración, la pregunta, la respuesta y la URL de la fuente.
7. Pasa el corrector: pídele a tu agente "Usa la skill corrector con el ejercicio 3" o ejecuta `node .agents/skills/corrector/scripts/corregir.mjs 3`.
8. Corrige lo que marque hasta que dé `accept` y haz commit del `opencode.json` y de tu entrega.

Recuerda lo que cuesta: la lista de herramientas del MCP va en todas las llamadas de la sesión, aunque no lo uses. Con Context7, en OpenCode 2, son unos 750 tokens más por llamada. Si quieres quitarlo después, borra el bloque o ponle `"disabled": true` al servidor.

## Qué entregas

Tu `opencode.json` con el MCP y `ejercicios/entregas/03-mcp.md` con sus cuatro partes, con el veredicto `accept` del corrector. Sin usar ningún modelo, comprueba que la configuración declara un MCP y que la entrega tiene la configuración, la pregunta, la respuesta y una URL en la fuente. Después, un modelo revisa que la duda sea de una librería del proyecto y que la fuente sea documentación de esa librería, no un blog ni la web del MCP.

## Con tu propio proyecto

Pregunta por una librería de tu proyecto. El corrector las saca de tu `package.json`. Pásale la ruta de tu entrega:

```bash
node .agents/skills/corrector/scripts/corregir.mjs 3 <ruta-de-tu-entrega>.md
```

En Claude Code y en Codex, el MCP se añade con una orden:

- Claude Code: `claude mcp add --scope project --transport http context7 https://mcp.context7.com/mcp`. Con `--scope project` se guarda en `.mcp.json`, en la raíz del repo, que es donde lo busca el corrector.
- Codex: `codex mcp add context7 --url https://mcp.context7.com/mcp`. Se guarda en `~/.codex/config.toml`, y el corrector también lo mira ahí.
