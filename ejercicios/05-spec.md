# Ejercicio 5 · La spec de tu primera feature

Vas a escribir con la skill `feature-spec` la spec de `anotar-gasto`, la siguiente feature de `cuentas-claras`, y a dejarla lista para que otra sesión la implemente sin preguntarte nada.

## Antes de empezar

- Parte del estado del ejercicio: `git checkout inicio-ejercicio-5`. Si vienes de tu ejercicio 4, puedes seguir desde ahí.
- Pon la clave del curso en tu terminal: `export DEVEXPERT_API_KEY=...`. El corrector la necesita aunque trabajes con otro agente. En Windows, usa Git Bash (lo explica el README).

## Pasos

1. Abre tu agente en la raíz del repo y pídele: "Usa la skill feature-spec". No le digas qué feature. Tiene que elegir `anotar-gasto`, la primera que está lista según sus dependencias.
2. Abre `docs/specs/anotar-gasto.md` y lee los escenarios de aceptación uno a uno. De cada uno, pregúntate si se ve desde fuera, si tiene datos concretos y si dice cómo se comprueba.
3. Busca en `docs/domain-model.md` las reglas que afectan a esta feature y comprueba que cada una tiene un escenario. Si una regla solo aparece en el enfoque técnico, nadie la va a comprobar.
4. Pasa el corrector: pídele a tu agente "Usa la skill corrector con el ejercicio 5" o ejecuta `node .agents/skills/corrector/scripts/corregir.mjs 5`.
5. Corrige lo que marque y vuelve a pasarlo hasta que dé `accept`. Las sugerencias no bloquean.

Cuando el corrector te marque un criterio, no le pidas al agente que lo arregle sin más. Busca tú el ejemplo concreto que lo hace comprobable: es una decisión de producto.

## Qué entregas

`docs/specs/anotar-gasto.md` con el veredicto `accept` del corrector. No implementes nada todavía, eso es el ejercicio 6.

## Con tu propio proyecto

Copia `.agents/skills/corrector` a tu proyecto (y a `.claude/skills/` si usas Claude Code) y pásale la ruta de tu spec:

```bash
node .agents/skills/corrector/scripts/corregir.mjs 5 docs/specs/<tu-feature>.md
```
