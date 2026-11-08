---
name: corrector
description: Corrige un ejercicio del curso de entrada de DevExpert y da un veredicto accept o revise con lo que falta. Úsala cuando el alumno pida corregir, revisar o "pasar el corrector" a un ejercicio (por ejemplo, "pasa el corrector al ejercicio 5", "corrige mi spec" o "corrige mi entrega del ejercicio 2").
---

# Corrector del curso

Ejecuta el corrector del ejercicio que pida el alumno y enséñale el resultado. El corrector combina comprobaciones fijas con una revisión hecha por un modelo de DevExpert Inference, así que su veredicto no depende del agente que lo ejecute.

## Cómo se usa

Desde la raíz del repo:

```bash
node .agents/skills/corrector/scripts/corregir.mjs <ejercicio> [fichero]
```

- `<ejercicio>` es el número del ejercicio. De momento:
  - `1` (mide el contexto). `[fichero]` es la entrega; si no se indica, `ejercicios/entregas/01-contexto.md`. Comprueba que la plantilla está completa, que la sesión cargada empieza la tarea con más contexto y que el coste cuadra con los tokens, y un modelo revisa que las conclusiones salgan de sus datos.
  - `2` (pon límites). `[fichero]` es la entrega; si no se indica, `ejercicios/entregas/02-permisos.md`. Comprueba que `opencode.json` (o `.claude/settings.json`) deniega tocar la carpeta, que la entrega tiene la configuración y la salida, y un modelo revisa que la salida muestre un bloqueo de esa carpeta.
  - `3` (conecta un MCP de documentación). `[fichero]` es la entrega; si no se indica, `ejercicios/entregas/03-mcp.md`. Comprueba que hay un MCP declarado y que la entrega tiene sus cuatro partes, con una URL, y un modelo revisa que la duda sea de una librería del proyecto y la fuente, su documentación.
  - `4` (prepara el repo). Sin `[fichero]`: los siete ficheros de `build-brief` y `harness-starter`, `AGENTS.md` con menos de 100 líneas, `feature_list.json` con su esquema y sin ciclos, y `./init.sh` en verde. Un modelo revisa que cada feature quepa en una sesión y que las reglas del briefing estén en el modelo de dominio. Tarda un poco.
- Necesita la clave del curso en `DEVEXPERT_API_KEY`. Si falta, explícale al alumno cómo ponerla y no sigas.
- Sale con código 0 si el veredicto es `accept`, con 1 si es `revise` y con 2 si no ha podido corregir.
- Los ejercicios que ejecutan `./init.sh` tardan un poco. Espera a que termine.

## Reglas

- Enseña la salida del corrector tal cual, sin resumirla.
- No corrijas el trabajo del alumno por tu cuenta. El ejercicio es suyo: si te pide ayuda con un criterio marcado, ayúdale a encontrar el ejemplo concreto que lo hace comprobable, pero que decida él.
- Si el veredicto es `revise`, termina diciendo qué ha marcado el corrector y que vuelva a pasarlo cuando lo haya cambiado.

## Calibrar (para quien mantiene el curso)

`node .agents/skills/corrector/scripts/calibrar.mjs [vueltas] [ejercicio...]` corrige varias veces las entregas buenas y malas de `pruebas/ejercicio-N/` y las compara con su `esperado.json`. Tiene que coincidir en todas las vueltas.
