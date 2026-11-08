# Ejercicio 8 · Crea tu propia skill

Vas a crear una skill para algo que repites, por ejemplo preparar la descripción de un PR, y a comprobar que el agente la carga solo cuando toca.

## Antes de empezar

- Parte del estado del ejercicio: `git checkout inicio-ejercicio-8`. Ahí `anotar-gasto` ya está aceptada. Si vienes de tu ejercicio 7, sigue desde ahí.
- Pon la clave del curso en tu terminal: `export DEVEXPERT_API_KEY=...`. En Windows, usa Git Bash (lo explica el README).
- Mira una skill del curso por dentro, por ejemplo `.agents/skills/feature-spec/SKILL.md`: el frontmatter con `name` y `description` y, debajo, las instrucciones.

## Pasos

1. Elige algo que le explicas al agente una y otra vez. Si no se te ocurre nada, haz `descripcion-pr`: preparar la descripción de un PR a partir del diff y de la spec.
2. Pídele a tu agente que la cree: "Crea una skill descripcion-pr en .agents/skills/ que prepare la descripción de un PR a partir del diff de la rama y de la spec de la feature". Si usas Claude Code, enlázala también en `.claude/skills/` como las demás (`ln -s ../../.agents/skills/descripcion-pr .claude/skills/descripcion-pr`).
3. Revisa la descripción: tiene que decir qué hace y cuándo usarla, con las palabras que usarías al pedirlo. Revisa también las instrucciones: qué leer, qué partes tiene el resultado y qué no debe hacer (por ejemplo, abrir el PR).
4. Pruébala en una sesión nueva sin nombrarla: "Prepárame la descripción del PR". Comprueba que la carga sola. Después pide algo parecido que no le toca, como "haz commit de esto", y comprueba que no la carga.
5. Pasa el corrector: "Usa la skill corrector con el ejercicio 8" o `node .agents/skills/corrector/scripts/corregir.mjs 8`. Si tienes varias skills tuyas, añade su nombre al final.
6. Corrige lo que marque hasta que dé `accept` y haz commit.

## Qué entregas

`.agents/skills/<nombre>/SKILL.md` con `name` igual que la carpeta, una `description` que dice qué hace y cuándo usarla, e instrucciones concretas. El corrector comprueba la estructura y le da a un modelo tres peticiones de prueba con solo los nombres y las descripciones de todas las skills del repo, como hace el agente: tiene que cargar la tuya en las dos que le tocan y no en la tercera.

## Con tu propio proyecto

Crea la skill en tu proyecto y pásale al corrector su nombre o la ruta de su `SKILL.md`:

```bash
node .agents/skills/corrector/scripts/corregir.mjs 8 <nombre-de-tu-skill>
```

OpenCode lee las skills de `.opencode/skills/`, `.claude/skills/` y `.agents/skills/`. Claude Code, de `.claude/skills/`. Codex, de `.agents/skills/`. Las tres usan el mismo formato de `SKILL.md`.
