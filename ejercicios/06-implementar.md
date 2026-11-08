# Ejercicio 6 · Implementa la feature

Vas a darle a una sesión nueva la spec de `anotar-gasto` para que la implemente, primero con un plan y después en pasos pequeños, y a revisar el diff antes de darla por buena.

## Antes de empezar

- Parte del estado del ejercicio: `git checkout inicio-ejercicio-6`. Ahí está la spec de `anotar-gasto` ya aceptada por el corrector y nada de su código. Si vienes de tu ejercicio 5 con tu spec aceptada, puedes seguir con la tuya.
- Pon la clave del curso en tu terminal: `export DEVEXPERT_API_KEY=...`. En Windows, usa Git Bash (lo explica el README).
- Comprueba que la base está en verde: `./init.sh`.

## Pasos

1. Abre tu agente en una sesión nueva, en la raíz del repo, y pídele un plan sin código: "Dame un plan corto para implementar docs/specs/anotar-gasto.md, sin tocar código todavía". Léelo. Si se sale de la spec o se salta los tests, díselo antes de seguir.
2. Pídele la implementación con el prompt del Harness Starter:

   ```
   Implementa la feature anotar-gasto siguiendo docs/specs/anotar-gasto.md. No salgas de su alcance.
   Al terminar, ejecuta ./init.sh y las verificaciones de la spec, registra la evidencia
   en feature_list.json, marca la feature como passing y actualiza PROGRESS.md.
   ```

3. Mientras trabaja, páralo si se sale de la spec, si arregla un test cambiando el test o si da vueltas sin avanzar.
4. Lee el diff (`git diff`) antes de aceptar nada. Mira tres cosas: que no toque nada fuera de la spec, que los tests comprueben lo que dicen los escenarios (por ejemplo, los 3,34 €, 3,33 € y 3,33 € del escenario 1) y que no haya ficheros que no tocaban.
5. Pasa el corrector: pídele a tu agente "Usa la skill corrector con el ejercicio 6" o ejecuta `node .agents/skills/corrector/scripts/corregir.mjs 6`. Pasa `./init.sh` y unos tests del curso que no has visto, escritos contra la interfaz de la spec.
6. Si falla un test del curso, busca en la spec el escenario que lo cubre y vuelve a la sesión del implementador con ese escenario. Repite hasta que dé `accept`.
7. Haz commit del trabajo.

## Qué entregas

`anotar-gasto` implementada y en `passing` en `feature_list.json`, con su evidencia, y el veredicto `accept` del corrector. Todavía no la marques como `accepted`: eso lo decide la validación del ejercicio 7.

## Con tu propio proyecto

Haz commit de la spec antes de empezar. Después de implementar, pásale al corrector la ruta de la spec:

```bash
node .agents/skills/corrector/scripts/corregir.mjs 6 docs/specs/<tu-feature>.md
```

Sin tests del curso, el corrector toma el diff desde el último commit que tocó la spec (incluidos los ficheros nuevos sin commit) y un modelo comprueba que cada escenario tiene un test, que el diff no se sale del alcance y que los tests no se han debilitado para que pasen.

Si usas Claude Code o Codex, el flujo es el mismo: el plan con el mismo prompt (en Claude Code también vale su modo plan), la implementación con el mismo prompt y el corrector con la misma orden.
