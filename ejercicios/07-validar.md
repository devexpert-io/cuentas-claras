# Ejercicio 7 · Valida en una sesión nueva

Vas a validar `anotar-gasto` con la skill `feature-validator` en una sesión que no escribió el código, y a corregir lo que haga falta hasta que dé `accept`.

## Antes de empezar

- Parte del estado del ejercicio: `git checkout inicio-ejercicio-7`. Ahí `anotar-gasto` está implementada y en `passing`, sin validar. Si vienes de tu ejercicio 6, sigue con tu implementación.
- Pon la clave del curso en tu terminal: `export DEVEXPERT_API_KEY=...`. En Windows, usa Git Bash (lo explica el README).

## Pasos

1. Cierra la sesión del implementador y abre una nueva en la raíz del repo. Quien valida no debe haber escrito el código.
2. Pídele: "Usa la skill feature-validator". Sin decirle nada más, elige la feature en `passing`.
3. Lee el veredicto y la evidencia. Cuenta lo que ha ejecutado de verdad (comandos con su salida, pruebas a mano con sus datos), no lo que opina.
4. Según el veredicto:
   - `accept`: confírmaselo para que pase la feature a `accepted` y deje la validación en `feature_list.json` y `PROGRESS.md`.
   - `revise`: copia el "Implementation Repair Brief" tal cual, pásaselo a una sesión de implementación y, cuando termine, vuelve a validar en otra sesión nueva.
   - `block`: resuelve lo que te diga antes de seguir.
5. Pasa el corrector: pídele a tu agente "Usa la skill corrector con el ejercicio 7" o ejecuta `node .agents/skills/corrector/scripts/corregir.mjs 7`.
6. Haz commit.

## Qué entregas

`anotar-gasto` en `accepted`, con la evidencia de la validación en `feature_list.json` y una sesión de validación en `PROGRESS.md` con su veredicto. El corrector comprueba eso, que los tests del curso del ejercicio 6 siguen pasando y que la validación cita evidencia ejecutada y no solo opiniones.

## Con tu propio proyecto

Valida tu feature igual y pásale al corrector su id:

```bash
node .agents/skills/corrector/scripts/corregir.mjs 7 <id-de-tu-feature>
```

En un proyecto propio no hay tests del curso: el corrector mira el estado, la evidencia y la sesión de validación de `PROGRESS.md`.

Con Claude Code o Codex vale lo mismo. Lo importante es que la validación sea en una sesión nueva, sin la historia de la implementación (en Claude Code, `/clear` o una terminal nueva).
