# Ejercicio 1 · Mide el contexto

Vas a hacer la misma tarea en una sesión nueva y en otra cargada, y a apuntar los tokens, el coste y el resultado de cada una para ver con tus datos lo que cuesta el contexto.

## Antes de empezar

- Parte del estado del ejercicio: `git checkout inicio-ejercicio-5`.
- Pon la clave del curso en tu terminal: `export DEVEXPERT_API_KEY=...`. La usan OpenCode y el corrector. En Windows, usa Git Bash (lo explica el README).
- Las dos sesiones son preguntas: el agente no tiene que cambiar nada del repo.

## Pasos

1. Sesión nueva. Desde la raíz del repo, lanza la tarea:

   ```bash
   opencode run "¿Qué hace la CLI si creo un grupo con dos miembros que se llaman igual, por ejemplo Ana y ana? Dime el mensaje que sale y en qué fichero se decide."
   ```

2. Comprueba si ha acertado: `CUENTAS_DIR=$(mktemp -d) pnpm cuentas grupo crear "Piso" --miembros Ana,ana`. Con la carpeta temporal no se guarda nada en el repo.
3. Sesión cargada. Abre otra sesión y cárgala antes de la tarea:

   ```bash
   opencode run "Lee todos los ficheros de src/, tests/ y docs/ y resúmeme en una línea qué hace cada uno."
   ```

   Después, en esa misma sesión (`--continue`), la misma tarea del paso 1, con las mismas palabras:

   ```bash
   opencode run --continue "¿Qué hace la CLI si creo un grupo con dos miembros que se llaman igual, por ejemplo Ana y ana? Dime el mensaje que sale y en qué fichero se decide."
   ```

4. Mide las dos sesiones: `node ejercicios/medir-sesion.mjs`. Te enseña las dos últimas sesiones de OpenCode en esta carpeta y, de cada petición, las llamadas al modelo, el contexto con el que empezó, la entrada nueva, la cacheada y la salida. En la sesión cargada, apunta los datos de la petición 2, la de la tarea.
5. Rellena `ejercicios/entregas/01-contexto.md`. El coste lo calculas tú con los precios del vídeo 4, por millón de tokens: entrada nueva 0,30 $, entrada cacheada 0,006 $ y salida 1,20 $. Por ejemplo, 9.708 de entrada nueva, 50.048 cacheados y 892 de salida son 0,0029 + 0,0003 + 0,0011 = 0,0043 $.
6. Escribe tus conclusiones: qué ha cambiado entre las dos sesiones, por qué crees que ha pasado y qué harías la próxima vez. Con tus números, no con frases que valdrían para cualquiera.
7. Pasa el corrector: pídele a tu agente "Usa la skill corrector con el ejercicio 1" o ejecuta `node .agents/skills/corrector/scripts/corregir.mjs 1`.
8. Corrige lo que marque hasta que dé `accept` y haz commit de tu entrega.

Si prefieres la interfaz de OpenCode a `opencode run`, vale igual: abre `opencode` para cada sesión y escribe las mismas peticiones.

## Qué entregas

`ejercicios/entregas/01-contexto.md` con la plantilla completa y el veredicto `accept` del corrector. Sin usar ningún modelo, comprueba que están todos los datos, que la sesión cargada empieza la tarea con más contexto que la nueva y que el coste de cada una cuadra con sus tokens. Después, un modelo revisa que tus conclusiones salgan de tus datos y no sean genéricas.

No te preocupes si los números no salen como esperabas: a veces la sesión cargada hace menos llamadas porque ya ha leído los ficheros. Lo que cuenta es que lo midas y lo expliques.

## Con tu propio proyecto

Elige una pregunta sobre tu código que se pueda comprobar y carga la segunda sesión pidiéndole que lea las carpetas principales. Copia a tu proyecto `ejercicios/medir-sesion.mjs`, la plantilla y `.agents/skills/corrector`, y pásale la ruta de tu entrega:

```bash
node .agents/skills/corrector/scripts/corregir.mjs 1 <ruta-de-tu-entrega>.md
```

`medir-sesion.mjs` solo lee sesiones de OpenCode, y el corrector comprueba el coste con los precios del modelo `chat`. Si trabajas con Claude Code o Codex, haz este ejercicio con OpenCode y la clave del curso: lo que mides es el contexto, y eso funciona igual en las tres herramientas.
