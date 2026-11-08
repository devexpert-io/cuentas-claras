# Feature Implementation Spec: Anotar un gasto repartido a partes iguales

## Source Feature

- `id`: anotar-gasto
- `area`: gastos
- `depends_on`: crear-grupo (`accepted`)
- `status`: `not_started` en el momento de planificar
- `source`: `feature_list.json`

## Goal

Desde la terminal se anota un gasto en un grupo ya guardado: concepto, importe, pagador y participantes. El gasto se reparte a partes iguales entre sus participantes (todos los miembros si no se indican) y queda guardado en el fichero del grupo. La CLI confirma el gasto con su identificador, el importe, el pagador y la parte de cada participante.

Esta feature fija cuatro decisiones que necesitan las siguientes: el grupo se indica por su nombre, como al crearlo; los importes se escriben con coma o punto y como mucho dos decimales, y se guardan en céntimos; el orden alfabético de los céntimos sobrantes no distingue mayúsculas ni tildes; cada gasto recibe un identificador entero dentro del grupo que no cambia y no se reutiliza (`borrar-gasto` lo usará). Cierra las cuatro preguntas de implementación de `docs/risks-and-open-questions.md`.

## Non-Goals

- Ver saldos (`ver-saldos`), liquidar (`liquidar`), registrar pagos (`registrar-pago`) o borrar gastos (`borrar-gasto`).
- Repartos por partes o porcentajes (`reparto-desigual`, fuera del MVP).
- Listar, ver, editar o buscar gastos. Un gasto con error se borrará y se anotará de nuevo en otra feature.
- Cambiar el comportamiento de `grupo crear` ni el fichero que escribe: los grupos nuevos siguen sin campo `gastos` hasta que se anota el primero.
- Varias monedas, miles con separador, símbolo `€` al escribir el importe o importes negativos.
- Bloqueo o control de escrituras concurrentes sobre el fichero del grupo.

## Job Story

Cuando alguien adelanta dinero por el grupo,
quiero anotar qué pagó, cuánto y entre quiénes se reparte,
para que el grupo sepa desde ese momento lo que le corresponde a cada miembro.

## Users And Permissions

- Cualquier persona que ejecute la CLI: puede anotar gastos en cualquier grupo. No hay cuentas, roles ni permisos (`docs/build-brief.md`).

## Acceptance Scenarios

### Scenario 1: anotar un gasto entre todos los miembros

Given un grupo guardado `Piso Lavapiés` con los miembros Ana, Bea y Carlos y sin gastos
When se ejecuta `pnpm cuentas gasto anotar "Piso Lavapiés" "Cena" --importe 10,00 --pagador Carlos`
Then la CLI muestra `Gasto 1 anotado en "Piso Lavapiés": "Cena", 10,00 €, pagado por Carlos. Partes: Ana 3,34 €, Bea 3,33 € y Carlos 3,33 €.` y termina con código 0
And el céntimo que sobra es para Ana, la primera por orden alfabético, aunque haya pagado Carlos, y las tres partes suman 10,00 €
And el fichero del grupo contiene un gasto con `id: 1`, `concepto: "Cena"`, `importeCentimos: 1000`, `pagador: "Carlos"` y `participantes: ["Ana", "Bea", "Carlos"]`

### Scenario 2: céntimos sobrantes por orden alfabético, sin mayúsculas ni tildes

Given un grupo guardado `Viaje a Oporto` con los miembros Bea, carlos, Ángel y Dani, en ese orden, y sin gastos
When se ejecuta `pnpm cuentas gasto anotar "Viaje a Oporto" "Peaje" --importe 10,02 --pagador Dani`
Then la CLI muestra `Gasto 1 anotado en "Viaje a Oporto": "Peaje", 10,02 €, pagado por Dani. Partes: Ángel 2,51 €, Bea 2,51 €, carlos 2,50 € y Dani 2,50 €.` y termina con código 0
And los dos céntimos sobrantes van de uno en uno a Ángel y a Bea, los dos primeros por orden alfabético

### Scenario 3: participantes indicados y pagador que no participa

Given un grupo guardado `Piso Lavapiés` con los miembros Ana, Bea y Carlos y sin gastos
When se ejecuta `pnpm cuentas gasto anotar "Piso Lavapiés" "Taxi" --importe 20,00 --pagador Ana --participantes "Bea, Carlos"`
Then la CLI muestra `Gasto 1 anotado en "Piso Lavapiés": "Taxi", 20,00 €, pagado por Ana. Partes: Bea 10,00 € y Carlos 10,00 €.` y termina con código 0
And el gasto guardado tiene `id: 1`, `pagador: "Ana"` y `participantes: ["Bea", "Carlos"]`

### Scenario 4: los nombres se resuelven como los del grupo

Given el grupo `Piso Lavapiés` con `Ana`, `Bea` y `Carlos`
When se ejecuta `pnpm cuentas gasto anotar "piso lavapies" "Pan" --importe 3 --pagador ana --participantes "béa,carlos"`
Then termina con código 0 y el gasto se guarda en `piso-lavapies.json`
And se guardan los nombres tal como están en el grupo: `pagador: "Ana"` y `participantes: ["Bea", "Carlos"]`

### Scenario 5: formatos de importe aceptados

When se anota un gasto con `--importe 12,5`, con `--importe 12.50` o con `--importe 12`
Then se guarda `importeCentimos: 1250` en los dos primeros casos y `1200` en el tercero
And la CLI muestra siempre el importe como `12,50 €` o `12,00 €`

### Scenario 6: importe cero o negativo

Given el grupo `Piso Lavapiés` con Ana, Bea y Carlos y el contenido de su fichero antes de la orden
When se anota un gasto con `--importe 0` o con `--importe -3`
Then la CLI muestra `El importe tiene que ser mayor que cero.` y termina con código 1
And el fichero del grupo queda exactamente igual que antes

### Scenario 7: otros datos no válidos, sin guardar nada

Given un grupo guardado y el contenido del fichero antes de la orden
When se anota con un importe `12,345` o `doce`, con un concepto vacío, sin grupo, sin concepto, sin `--importe`, sin `--pagador`, con una opción desconocida o con un argumento de más
Then la CLI explica qué falla (y los errores de forma muestran el uso de la orden), termina con código 1
And el fichero del grupo queda exactamente igual que antes

### Scenario 8: el grupo no existe

When se anota un gasto en `Viaje a Oporto` y no hay ningún grupo con ese nombre
Then la CLI dice `No existe un grupo con el nombre "Viaje a Oporto".`, termina con código 1
And no se crea ningún fichero nuevo en la carpeta de datos

### Scenario 9: pagador o participantes que no son del grupo

Given el grupo `Piso Lavapiés` con Ana, Bea y Carlos
When se usa `--pagador Dani`, `--participantes "Ana,Dani"`, `--participantes "Ana,ana"` o `--participantes "Ana,,Bea"`
Then la CLI dice qué nombre no es miembro, que está repetido o que hay un nombre vacío, según el caso
And termina con código 1 y el fichero queda igual

### Scenario 10: grupo creado antes de esta feature

Given un fichero de grupo con solo `nombre` y `miembros`, sin `gastos`
When se anota un gasto válido
Then la orden lo acepta, añade `gastos` con el gasto nuevo e `id: 1`
And el resto del grupo queda igual

### Scenario 11: identificadores que no se reutilizan

Given un grupo cuyo último gasto guardado tiene `id: 7`
When se anota otro gasto
Then el gasto nuevo recibe `id: 8`
And anotar dos gastos seguidos en un grupo vacío da `id: 1` y `id: 2`

### Scenario 12: fichero del grupo ilegible

Given un fichero de grupo con JSON roto o con campos imposibles (por ejemplo, `gastos` que no es una lista, un `id` no entero o un participante que no es miembro)
When se intenta anotar un gasto
Then la CLI muestra `El grupo "…" no se puede leer: <detalle>.`, termina con código 1 y no muestra una traza de Node
And el fichero no cambia

### Scenario 13: no se puede guardar

Given un grupo válido cuyo fichero no se puede escribir
When se anota un gasto válido
Then la CLI muestra `No se pudo guardar el gasto en <carpeta>: <detalle>.`, termina con código 1 y no muestra una traza de Node

### Scenario 14: ayuda y órdenes incompletas

When se ejecuta `pnpm cuentas ayuda`
Then la ayuda incluye `gasto anotar` con su uso
And `pnpm cuentas gasto` o `pnpm cuentas gasto borrar` responden `Orden desconocida: gasto` o `Orden desconocida: gasto borrar` con código 1

## Repository Research

### Files Inspected

- `AGENTS.md` — dominio puro, CLI probada con `ejecutar`, `CUENTAS_DIR` temporal y sin dependencias de ejecución.
- `PROGRESS.md` — `crear-grupo` está `accepted`; la siguiente feature es `anotar-gasto`.
- `feature_list.json` — alcance, dependencias y verificación de `anotar-gasto`.
- `CONTEXT.md` — términos `Gasto`, `Concepto`, `Importe`, `Pagador`, `Participantes` y `Parte`.
- `docs/build-brief.md` — MVP, reparto a partes iguales y datos en `.cuentas/`.
- `docs/domain-model.md` — reglas 1, 2, 4, 5, 6 y 7, casos límite y estados del gasto.
- `docs/risks-and-open-questions.md` — las cuatro preguntas de implementación que cierra esta spec.
- `ARCHITECTURE.md` — capas, dirección de dependencias y ampliación del fichero del grupo.
- `src/dominio/grupo.ts` — `normalizarNombre`, `claveDeNombre`, `Grupo` y validación de miembros.
- `src/almacen.ts` — `carpetaDeDatos`, `rutaDelGrupo` y `guardarGrupoNuevo` (solo creación).
- `src/argumentos.ts` — lectura de opciones `--nombre valor` y `--nombre=valor`.
- `src/ordenes/orden.ts`, `src/ordenes/grupo-crear.ts` — forma de una orden y enumeración en español (`y`/`e`).
- `src/cli.ts` — tabla de órdenes y ayuda generada.
- `tests/grupo.test.ts`, `tests/grupo-crear.test.ts`, `tests/argumentos.test.ts`, `tests/cli.test.ts` — convenciones de test y carpetas temporales.
- `package.json`, `tsconfig.json`, `init.sh` — ESM, TypeScript estricto, scripts y gate de verificación.

No existen `CONSTRAINTS.md`, `DESIGN.md`, `pnpm test:e2e` ni otras specs además de `crear-grupo.md`.

### Existing Patterns To Follow

- Los módulos de `src/dominio/` son funciones puras y no importan módulos de Node.
- Solo `src/almacen.ts` lee o escribe ficheros; las rutas salen de `claveDeNombre`.
- Las órdenes devuelven `{ salida, codigo }` y no lanzan por errores del usuario.
- Los tests llaman a `ejecutar(args, { CUENTAS_DIR: <carpeta temporal> })` y comparan el fichero con `JSON.parse`.
- Todo en español, con los términos de `CONTEXT.md`.

### Current Gaps

- `almacen.ts` solo crea grupos (`wx`); no sabe leer ni actualizar un grupo existente.
- No hay lectura ni formateo de importes, ni funciones de reparto.
- No hay validación de un fichero de grupo leído a mano.
- El tipo `Grupo` no contempla gastos; hay que añadir un tipo que los incluya sin romper los grupos antiguos.
- No hay comando E2E. `src/main.ts` solo conecta `ejecutar` con la terminal; la prueba a mano y los tests de `ejecutar` cubren el flujo.

## Technical Approach

- **Dinero** (`src/dominio/dinero.ts`). `parsearImporte(texto)` acepta `12`, `12,5`, `12.50` y `12,50`: espacios de sobra fuera, dígitos y un solo separador con como mucho dos decimales. Rechaza el resto (símbolo `€`, separadores de miles, signos, exponentes) con un mensaje que muestra el ejemplo `12,50`. Calcula en céntimos enteros sin pasar por coma flotante y rechaza importes `<= 0` o fuera del entero seguro. `formatearImporte(centimos)` devuelve `12,50 €` con coma y dos decimales, y admite negativos para reutilizarlo en `ver-saldos`.
- **Reparto** (`src/dominio/gasto.ts`). `repartirIgual(importeCentimos, participantes)` ordena una copia de los participantes por `claveDeNombre` (comparación de cadenas, sin mayúsculas ni tildes) y reparte `Math.floor(importe / n)` a cada uno; los `importe % n` céntimos sobrantes van de uno en uno a los primeros del orden alfabético. Devuelve `{ miembro, centimos }[]` en ese orden alfabético; las partes suman exactamente el importe. No se guardan las partes: se recalculan cuando haga falta.
- **Modelo guardado** (`src/dominio/gasto.ts`). `Gasto` tiene `id`, `concepto`, `importeCentimos`, `pagador` y `participantes`. `GrupoConGastos extends Grupo` añade `gastos: Gasto[]`. El fichero de `crear-grupo` no cambia; `leerGrupo` devuelve siempre `gastos: []` si el fichero no lo tenía.
- **Anotar** (`anotarGasto(grupo, datos)` en `src/dominio/gasto.ts`). Recibe concepto, importe como texto, pagador y participantes opcionales. Valida en este orden: concepto vacío o sin letras ni números; importe; pagador miembro del grupo; participantes (lista no vacía, cada uno miembro, sin repetidos por `claveDeNombre`). Resuelve cada nombre escrito al nombre guardado en el grupo. Si no hay participantes, usa todos los miembros en su orden. El `id` es `1 + el mayor id existente` y no se reutiliza. Devuelve `{ ok: true, grupo, gasto }` o `{ ok: false, error }`; no muta el grupo recibido.
- **Almacén** (`src/almacen.ts`). `leerGrupo(carpeta, nombre)` devuelve `{ estado: "leido", grupo }`, `{ estado: "no-existe" }` o `{ estado: "ilegible", detalle }`. Lee la ruta de `rutaDelGrupo`, distingue `ENOENT`, y valida: JSON válido, `nombre` de texto, `miembros` lista de textos, `gastos` lista (vacía si falta) y cada gasto con la forma de arriba y con pagador y participantes del grupo. El nombre guardado tiene que tener la misma clave que el buscado. `guardarGrupo(carpeta, grupo)` sobrescribe el fichero del grupo con el mismo formato de dos espacios y salto final; cualquier otro error del sistema se propaga para que la orden lo explique.
- **Texto de la CLI** (`src/ordenes/texto.ts`). Mover `enumerar` desde `grupo-crear.ts` para compartir la enumeración `Ana, Bea y Carlos` con `y`/`e`. `grupo-crear.ts` no cambia de comportamiento.
- **Orden** (`src/ordenes/gasto-anotar.ts`). Uso: `gasto anotar "<grupo>" "<concepto>" --importe 12,50 --pagador Ana [--participantes Ana,Bea]`. Separa los dos posicionales; exige `--importe` y `--pagador`; `--participantes` es opcional y se parte por comas. Los errores de forma añaden `Uso: pnpm cuentas <uso>`. Después lee el grupo, llama a `anotarGasto` y guarda. La confirmación es `Gasto <id> anotado en "<grupo>": "<concepto>", <importe>, pagado por <pagador>. Partes: <participante> <parte>, … y <participante> <parte>.`, con las partes en el orden de `repartirIgual` y enumeradas con `enumerar`.
- **CLI** (`src/cli.ts`). Añadir una fila `["gasto", "anotar"]` a la tabla; la ayuda se genera sola. No se toca `main.ts`.

## Expected File Changes

- `src/dominio/dinero.ts` — create: lectura y formato de importes en céntimos.
- `src/dominio/gasto.ts` — create: `Gasto`, `GrupoConGastos`, `repartirIgual` y `anotarGasto`.
- `src/almacen.ts` — modify: `leerGrupo`, validación de lo leído y `guardarGrupo`.
- `src/ordenes/texto.ts` — create: `enumerar` compartido.
- `src/ordenes/grupo-crear.ts` — modify: usar `enumerar` de `texto.ts` (sin cambio de comportamiento).
- `src/ordenes/gasto-anotar.ts` — create: la orden `gasto anotar`.
- `src/cli.ts` — modify: fila de la orden y ayuda.
- `tests/dinero.test.ts`, `tests/gasto.test.ts`, `tests/gasto-anotar.test.ts` — create.
- `tests/cli.test.ts` — modify: la ayuda incluye `gasto anotar` y las órdenes incompletas.
- `ARCHITECTURE.md`, `docs/domain-model.md`, `docs/risks-and-open-questions.md` — ver Durable Documentation Impact.
- `feature_list.json`, `PROGRESS.md` — modify al implementar: estado y evidencia.

## Visual Design Impact

- UI involved: no. Es texto en la terminal.
- Design source: no aplica.
- Screens or states affected: ninguno.
- New design artifact required: no.

## Durable Documentation Impact

- `ARCHITECTURE.md`: update — nuevos módulos de dominio (`dinero`, `gasto`), lectura y actualización de grupos en el almacén, y forma del fichero del grupo con `gastos` opcional al leer.
- `CONSTRAINTS.md`: not needed — las reglas nuevas son de dominio y de formato de datos, y se cubren en `docs/domain-model.md` y `ARCHITECTURE.md`.
- `AGENTS.md`: not needed — el flujo de trabajo y la verificación no cambian.
- `docs/domain-model.md`: update — nueva regla 12: cada gasto tiene un identificador dentro de su grupo que no cambia y no se reutiliza.
- `docs/risks-and-open-questions.md`: update — quitar las cuatro preguntas de implementación que cierra esta spec (grupo, importe, orden alfabético e identificador). Se mantienen los riesgos.
- `CONTEXT.md`: not needed — `Gasto` ya está definido; el identificador es un detalle de la regla 12.
- `README.md` / `init.sh`: not needed — la ayuda de la CLI ya documenta la orden y el gate no cambia.

## Implementation Plan

1. Dinero: `parsearImporte` y `formatearImporte` con tests.
2. Dominio del gasto: `Gasto`, `GrupoConGastos`, `repartirIgual` y `anotarGasto` con tests (escenarios 1 a 11).
3. Almacén: `leerGrupo` con validación y `guardarGrupo`, con tests de ficheros antiguos, rotos y actualización.
4. Orden `gasto anotar` y fila en `src/cli.ts`; tests de `ejecutar` con carpeta temporal (escenarios 1 a 14).
5. Documentación durable, `./init.sh`, prueba a mano y evidencia.

## Implementation Tasks

- [ ] `src/dominio/dinero.ts` con `parsearImporte` y `formatearImporte`.
- [ ] `tests/dinero.test.ts`: coma, punto, entero, un decimal, dos decimales, cero, negativo, tres decimales, texto, símbolo y signos.
- [ ] `src/dominio/gasto.ts` con `Gasto`, `GrupoConGastos`, `repartirIgual` y `anotarGasto`.
- [ ] `tests/gasto.test.ts`: 10,00 € entre Ana, Bea y Carlos con Carlos de pagador (334/333/333), orden con tildes y mayúsculas, importe de 1 céntimo, suma exacta, todos los miembros por defecto, pagador fuera de participantes, un solo participante, nombres resueltos, errores y `id` máximo + 1.
- [ ] `src/almacen.ts`: `leerGrupo` (ENOENT, JSON roto, campos inválidos, fichero antiguo) y `guardarGrupo`; `src/ordenes/texto.ts` y ajuste de `grupo-crear.ts`.
- [ ] `src/ordenes/gasto-anotar.ts` y fila `gasto anotar` en `src/cli.ts`; `tests/gasto-anotar.test.ts` con carpeta temporal y `tests/cli.test.ts` ampliado.
- [ ] `ARCHITECTURE.md`, `docs/domain-model.md` y `docs/risks-and-open-questions.md`.
- [ ] `./init.sh`, prueba a mano, evidencia en `feature_list.json` y `PROGRESS.md`.

## Verification Plan

- `./init.sh` termina con código 0: instala con el lockfile, `pnpm typecheck` sin errores y `pnpm test` en verde. No arranca procesos largos.
- Tests de dominio: céntimos enteros, reparto exacto, céntimos sobrantes por orden alfabético sin mayúsculas ni tildes y suma de partes igual al importe.
- Tests de `tests/gasto-anotar.test.ts` con `ejecutar` y `CUENTAS_DIR` temporal: escenarios 1 a 14, comprobando en cada error que el fichero no cambia.
- Prueba a mano en una carpeta temporal:
  - `CUENTAS_DIR=$(mktemp -d) pnpm cuentas grupo crear "Piso Lavapiés" --miembros Ana,Bea,Carlos`
  - `CUENTAS_DIR=<misma> pnpm cuentas gasto anotar "Piso Lavapiés" "Compra del súper" --importe 30,00 --pagador Ana`
  - Revisar el fichero `piso-lavapies.json` con `gastos`.
  - Repetir con un importe inválido y comprobar el código 1 y que el fichero no cambia.
- E2E: el repo no tiene comando E2E. No hace falta: `main.ts` solo conecta `ejecutar` con la terminal y la prueba a mano cubre esa conexión.

## Evidence To Capture

- Resumen de `./init.sh`: código de salida y número de tests.
- Ficheros de test y escenarios cubiertos.
- Salida de la prueba a mano, contenido del fichero, una segunda anotación y un intento con importe inválido.

## Validator Checklist

- [ ] Implementación dentro del alcance: sin saldos, liquidación, pagos, borrado ni reparto desigual.
- [ ] Los escenarios 1 a 14 pasan.
- [ ] Los importes se calculan y guardan en céntimos enteros; nunca con decimales.
- [ ] Las partes suman exactamente el importe y los céntimos sobrantes siguen el orden alfabético sin mayúsculas ni tildes.
- [ ] El dominio no importa módulos de Node y solo `src/almacen.ts` toca ficheros.
- [ ] Los grupos creados antes (sin `gastos`) se leen y se amplían sin perder datos.
- [ ] Un fichero ilegible produce un mensaje claro, no una traza de Node, y no se sobrescribe.
- [ ] Los identificadores son enteros positivos, no cambian y no se reutilizan.
- [ ] Ningún test escribe en la `.cuentas/` del repo y no hay dependencias nuevas en `package.json`.
- [ ] Mensajes en español con los términos de `CONTEXT.md`.
- [ ] Documentación durable actualizada según lo indicado y `AGENTS.md` sigue corto.
- [ ] Evidencia en `feature_list.json` y `PROGRESS.md`. `./init.sh` sigue pasando.
