---
name: corrector
description: Corrige un ejercicio del curso de entrada de DevExpert y da un veredicto accept o revise con lo que falta. Úsala cuando el alumno pida corregir, revisar o "pasar el corrector" a un ejercicio (por ejemplo, "pasa el corrector al ejercicio 5" o "corrige mi spec").
---

# Corrector del curso

Ejecuta el corrector del ejercicio que pida el alumno y enséñale el resultado. El corrector combina comprobaciones fijas con una revisión hecha por un modelo de DevExpert Inference, así que su veredicto no depende del agente que lo ejecute.

## Cómo se usa

Desde la raíz del repo:

```bash
node .agents/skills/corrector/scripts/corregir.mjs <ejercicio> [fichero]
```

- `<ejercicio>` es el número del ejercicio. De momento: `5` (la spec de tu primera feature).
- `[fichero]` es opcional. En el ejercicio 5, si no se indica, corrige `docs/specs/<id>.md` de la primera feature de `feature_list.json` que esté lista según sus dependencias y sin aceptar, la misma que elige `feature-spec`. En un proyecto propio sin `feature_list.json`, pasa la ruta de la spec.
- Necesita la clave del curso en `DEVEXPERT_API_KEY`. Si falta, explícale al alumno cómo ponerla y no sigas.
- Sale con código 0 si el veredicto es `accept`, con 1 si es `revise` y con 2 si no ha podido corregir.

## Reglas

- Enseña la salida del corrector tal cual, sin resumirla.
- No corrijas el trabajo del alumno por tu cuenta. El ejercicio es suyo: si te pide ayuda con un criterio marcado, ayúdale a encontrar el ejemplo concreto que lo hace comprobable, pero que decida él.
- Si el veredicto es `revise`, termina diciendo qué ha marcado el corrector y que vuelva a pasarlo cuando lo haya cambiado.
