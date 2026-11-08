---
name: corrector
description: Corrige un ejercicio del curso de entrada de DevExpert y da un veredicto accept o revise con lo que falta. Úsala cuando el alumno pida corregir, revisar o "pasar el corrector" a un ejercicio (por ejemplo, "pasa el corrector al ejercicio 0" o "corrige mi ejercicio").
---

# Corrector del curso

Ejecuta el corrector del ejercicio que pida el alumno y enséñale el resultado. El corrector combina comprobaciones fijas con, en los ejercicios que lo necesitan, una revisión hecha por un modelo de DevExpert Inference, así que su veredicto no depende del agente que lo ejecute.

## Cómo se usa

Desde la raíz del repo:

```bash
node .agents/skills/corrector/scripts/corregir.mjs <ejercicio> [fichero]
```

- `<ejercicio>` es el número del ejercicio. De momento: `0` (primer contacto): Node, pnpm, la clave, `pnpm test` y tu primer commit después de `inicio-ejercicio-0`. No lleva `[fichero]`. Los correctores de los demás ejercicios llegan con la etiqueta de cada uno.
- Necesita la clave del curso en `DEVEXPERT_API_KEY`. Si falta, explícale al alumno cómo ponerla (`export DEVEXPERT_API_KEY=...` en la terminal, nunca en un fichero) y no sigas.
- Sale con código 0 si el veredicto es `accept`, con 1 si es `revise` y con 2 si no ha podido corregir.

## Reglas

- Enseña la salida del corrector tal cual, sin resumirla.
- No corrijas el trabajo del alumno por tu cuenta. El ejercicio es suyo.
- Si el veredicto es `revise`, termina diciendo qué ha marcado el corrector y que vuelva a pasarlo cuando lo haya cambiado.

## Calibrar (para quien mantiene el curso)

`node .agents/skills/corrector/scripts/calibrar.mjs [vueltas] [ejercicio...]` corrige varias veces las entregas de `pruebas/ejercicio-N/` y las compara con su `esperado.json`. Tiene que coincidir en todas las vueltas.
