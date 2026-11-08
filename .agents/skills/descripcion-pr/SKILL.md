---
name: descripcion-pr
description: Prepara la descripción de un pull request a partir del diff de la rama y de la spec de la feature en docs/specs/. Úsala cuando pidan la descripción de un PR, el texto para abrir un pull request o un resumen de los cambios para revisarlos. No hace el commit, no abre el PR ni revisa el código.
---

# Descripción del PR

Escribe la descripción de un pull request para que quien lo revise sepa qué cambia, por qué y cómo comprobarlo sin leer todo el diff.

## Qué leer

1. El diff de la rama contra `main`: `git diff main...HEAD` y `git log --oneline main..HEAD`. Si hay cambios sin commit, `git diff` también.
2. La spec de la feature en `docs/specs/<feature-id>.md`. El id sale de los commits, de la rama o de `feature_list.json` (la feature en `passing` o la última en `accepted`).
3. La evidencia de la feature en `feature_list.json` y la última sesión de `PROGRESS.md`.

## Qué escribir

En español y en Markdown, con estas partes:

- **Título**: en Conventional Commits, por ejemplo `feat: anotar-gasto`.
- **Qué cambia**: dos o tres frases con el comportamiento nuevo, como lo vería quien usa la CLI.
- **Por qué**: la feature de `feature_list.json` y el enlace a su spec.
- **Cómo se ha comprobado**: los comandos que se han ejecutado con su resultado (`./init.sh`, número de tests) y las pruebas a mano. Solo lo que conste en la evidencia o lo que ejecutes tú: no inventes resultados.
- **Qué mirar al revisar**: los ficheros o decisiones que más conviene revisar, y lo que se ha dejado fuera de alcance.

## Reglas

- No hagas commit, no abras el PR ni lo publiques. Enseña la descripción y deja que el usuario decida.
- Si el diff incluye cambios que no están en la spec, dilo en "Qué mirar al revisar".
- Usa los términos de `CONTEXT.md`.
