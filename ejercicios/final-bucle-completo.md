# Ejercicio final · Dos features con el bucle completo, sin ayuda

Vas a hacer `ver-saldos` y `liquidar` de principio a fin con el arnés que has montado: spec, implementación y validación en otra sesión. Si el corrector acepta las dos, consigues el certificado del curso.

## Antes de empezar

- Parte del estado del ejercicio: `git checkout inicio-ejercicio-final`. Ahí `anotar-gasto` ya está aceptada y tienes de ejemplo la skill `descripcion-pr` del ejercicio 8. Si vienes de tu ejercicio 8, sigue desde ahí.
- Pon la clave del curso en tu terminal: `export DEVEXPERT_API_KEY=...`. En Windows, usa Git Bash (lo explica el README).
- Comprueba que la base está en verde: `./init.sh`.

## Lo que piden los tests del curso

El corrector pasa unos tests que no has visto contra la CLI. Para que encajen, tus specs tienen que fijar esta interfaz. Lo demás (mensajes de error, cabeceras, orden de las líneas) lo decides tú en la spec.

- `pnpm cuentas saldos "<grupo>"` muestra una línea por miembro con su nombre, dos puntos y su saldo en euros, con `+` si le deben y `-` si debe: `Carlos: +6,67 €`, `Ana: -3,34 €`, `Bea: 0,00 €`.
- `pnpm cuentas liquidar "<grupo>"` muestra una línea por pago propuesto: `Ana paga 3,34 € a Carlos`. Si nadie debe nada, ninguna línea con "paga".
- Ninguna de las dos cambia el fichero del grupo.

## Pasos

Para cada feature, primero `ver-saldos` y después `liquidar`:

1. **Spec.** En una sesión nueva: "Usa la skill feature-spec". Elige sola la feature que toca. Revísala como en el ejercicio 5 (¿cuánto le toca a cada uno?, ¿qué pasa con los céntimos?) y pásale el corrector: `node .agents/skills/corrector/scripts/corregir.mjs 5`. Haz commit.
2. **Implementación.** En otra sesión nueva, primero el plan y después el prompt del Harness Starter: "Implementa la feature <id> siguiendo docs/specs/<id>.md. No salgas de su alcance. Al terminar, ejecuta ./init.sh y las verificaciones de la spec, registra la evidencia en feature_list.json, marca la feature como passing y actualiza PROGRESS.md." Lee el diff. Haz commit.
3. **Validación.** En otra sesión nueva: "Usa la skill feature-validator". Si da `revise`, pásale el Repair Brief al implementador y vuelve a validar. Cuando dé `accept`, confírmaselo. Haz commit.

Cuando tengas las dos, pasa el corrector: "Usa la skill corrector con el ejercicio final" o `node .agents/skills/corrector/scripts/corregir.mjs final`.

Un aviso para `liquidar`: la lista más corta de pagos no siempre es la que da el método voraz (el que más debe le paga al que más le deben). Pon en la spec un ejemplo en el que no lo sea.

## Qué entregas

`ver-saldos` y `liquidar` en `accepted`, cada una con su spec en `docs/specs/`, su evidencia en `feature_list.json` y su validación en `PROGRESS.md`, y `./init.sh` en verde. El corrector comprueba todo eso, pasa los tests del curso (los saldos suman cero, el ejemplo de la cena da Carlos +6,67 €, Ana -3,34 € y Bea -3,33 €, y los pagos de `liquidar` dejan todos los saldos a cero sin pasar de miembros menos uno), revisa que los escenarios de cada spec se puedan comprobar y que cada validación cite evidencia ejecutada.

## Con tu propio proyecto

Haz dos features de tu proyecto con el mismo bucle y pásale al corrector sus ids:

```bash
node .agents/skills/corrector/scripts/corregir.mjs final <id1>,<id2>
```

Sin tests del curso, el corrector mira el estado, las specs, las validaciones y `./init.sh`.
