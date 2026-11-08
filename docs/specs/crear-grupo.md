# Feature Implementation Spec: Crear un grupo con sus miembros

## Source Feature

- `id`: crear-grupo
- `area`: grupos
- `depends_on`: ninguna (`[]`)
- `status`: `not_started` en el momento de planificar
- `source`: `feature_list.json`

## Goal

Desde la terminal se crea un grupo con su nombre y sus miembros. El grupo queda guardado en la carpeta de datos y la CLI confirma el nombre y los miembros. Si algo no cumple las reglas, la CLI explica qué pasa, termina con código 1 y no guarda nada.

Es la primera feature que guarda datos, así que también fija tres cosas que usarán las siguientes: cómo se comparan los nombres, dónde y cómo se guarda cada grupo, y cómo se organizan las órdenes de la CLI. Cierra dos preguntas abiertas de `docs/risks-and-open-questions.md`: los nombres no distinguen mayúsculas ni tildes, y cada grupo va en un fichero JSON cuyo nombre sale de la clave del nombre del grupo.

## Non-Goals

- Gastos, saldos, liquidación y pagos (`anotar-gasto`, `ver-saldos`, `liquidar`, `registrar-pago`). El fichero del grupo no lleva campos para ellos todavía.
- Listar, ver, renombrar o borrar grupos.
- Añadir o quitar miembros de un grupo ya creado (fuera del MVP).
- Un máximo de miembros: el brief solo fija el mínimo de 2.
- Leer grupos guardados: ninguna orden lo necesita todavía.
- Cambiar `src/main.ts` o la forma de lanzar la CLI.

## Job Story

Cuando empiezo a compartir gastos con mi piso o con la gente de un viaje,
quiero crear el grupo con el nombre de cada uno,
para poder anotar a partir de ahí los gastos de todos.

## Users And Permissions

- Cualquier persona que ejecute la CLI: puede crear grupos. No hay cuentas, roles ni permisos (`docs/build-brief.md`).

## Acceptance Scenarios

### Scenario 1: crear un grupo

Given una carpeta de datos sin grupos
When se ejecuta `pnpm cuentas grupo crear "Piso Lavapiés" --miembros Ana,Bea,Carlos`
Then la CLI muestra `Grupo "Piso Lavapiés" creado con 3 miembros: Ana, Bea y Carlos.` y termina con código 0
And la carpeta de datos contiene `piso-lavapies.json` con el nombre y los miembros en el orden en que se escribieron

### Scenario 2: espacios de sobra

Given una carpeta de datos sin grupos
When se crea el grupo `"  Viaje   a Oporto "` con `--miembros " Ana , Bea "`
Then se guardan el nombre `Viaje a Oporto` y los miembros `Ana` y `Bea`

### Scenario 3: nombre de grupo vacío

When se ejecuta `grupo crear` sin nombre, con el nombre `""` o con un nombre sin letras ni números (`"!!!"`)
Then la CLI dice qué falla, termina con código 1 y no guarda nada

### Scenario 4: menos de 2 miembros

When se ejecuta `grupo crear "Cena" --miembros Ana`, o sin `--miembros`
Then la CLI dice que un grupo necesita al menos 2 miembros (o que faltan los miembros), termina con código 1 y no guarda nada

### Scenario 5: nombre de miembro vacío

When la lista de `--miembros` tiene un nombre vacío (`Ana,,Bea` o `Ana,Bea,`) o un nombre sin letras ni números
Then la CLI lo dice, termina con código 1 y no guarda nada

### Scenario 6: miembros repetidos

When la lista es `Ana,Bea,Ana`, `Ana,Bea,ana` o `Ángel,Angel`
Then la CLI dice qué nombres coinciden y, si no son idénticos, que los nombres no distinguen mayúsculas ni tildes
And termina con código 1 y no guarda nada

### Scenario 7: el grupo ya existe

Given un grupo guardado con el nombre `Piso Lavapiés`
When se crea otro grupo `Piso Lavapiés` o `piso lavapies`
Then la CLI dice que ya existe un grupo con ese nombre, termina con código 1 y el fichero que había no cambia

### Scenario 8: argumentos que no encajan

When se pasa una opción desconocida (`--miembro`), una opción repetida, una opción sin valor o un nombre con espacios sin comillas
Then la CLI explica el problema y muestra el uso de la orden, termina con código 1 y no guarda nada

### Scenario 9: nombre que apunta fuera de la carpeta de datos

When se crea el grupo `"../fuera"`
Then el fichero se guarda como `fuera.json` dentro de la carpeta de datos, nunca fuera de ella

### Scenario 10: no se puede guardar

Given `CUENTAS_DIR` apunta a un fichero en lugar de a una carpeta
When se crea un grupo válido
Then la CLI dice que no ha podido guardar el grupo y en qué carpeta, termina con código 1 y no muestra una traza de Node

### Scenario 11: ayuda y órdenes incompletas

When se ejecuta `pnpm cuentas ayuda`
Then la ayuda incluye `grupo crear` con su uso y dice dónde se guardan los datos
And `pnpm cuentas grupo` o `pnpm cuentas grupo borrar` responden `Orden desconocida: grupo` o `Orden desconocida: grupo borrar` con código 1

## Repository Research

### Files Inspected

- `AGENTS.md` — reglas de trabajo: dominio en funciones puras, CLI probada con `ejecutar`, `CUENTAS_DIR` temporal en tests y pruebas a mano, sin dependencias de ejecución.
- `PROGRESS.md` — `crear-grupo` es la siguiente feature lista y la base pasa `./init.sh`.
- `feature_list.json` — entrada de `crear-grupo` y de las features que la usarán.
- `CONTEXT.md` — términos `Grupo` y `Miembro` (nunca "usuario").
- `docs/build-brief.md` — superficie CLI, datos en `.cuentas/`, sin control de acceso.
- `docs/domain-model.md` — regla 3 (al menos 2 miembros, sin nombres repetidos) y ciclo de vida del grupo.
- `docs/risks-and-open-questions.md` — preguntas abiertas sobre nombres y almacenamiento que cierra esta spec.
- `package.json` — ESM, scripts `cuentas`, `typecheck` y `test`, sin dependencias de ejecución.
- `tsconfig.json` — `strict`, `NodeNext`, imports con extensión `.ts`, incluye `src` y `tests`.
- `.gitignore` — ya ignora `.cuentas/`.
- `init.sh` — instala con el lockfile y ejecuta `pnpm typecheck` y `pnpm test`.
- `src/cli.ts` — `ejecutar(args)` devuelve `{ salida, codigo }`, `ayuda()` lista las órdenes a mano.
- `src/main.ts` — escribe la salida en stdout si el código es 0 y en stderr si no, y fija `process.exitCode`.
- `tests/cli.test.ts` — dos tests de `ejecutar` (ayuda y orden desconocida).

No existen todavía: `ARCHITECTURE.md`, `CONSTRAINTS.md`, `DESIGN.md`, otras specs en `docs/specs/`, configuración de Vitest (usa la de serie) ni un comando E2E.

### Existing Patterns To Follow

- La CLI es una función que devuelve `{ salida, codigo }`. Los tests la llaman directamente, sin lanzar procesos.
- Módulos ESM con imports que terminan en `.ts`.
- Identificadores y mensajes en español.

### Current Gaps

- No hay lectura de opciones, ni módulo de dominio, ni almacenamiento.
- `ejecutar` solo recibe los argumentos: necesita también el entorno para leer `CUENTAS_DIR`.
- No hay E2E. `main.ts` son cuatro líneas, así que los tests de `ejecutar` con una carpeta real cubren el flujo. Se añade una prueba a mano con `pnpm cuentas`.

## Technical Approach

- **Nombres** (`src/dominio/grupo.ts`, funciones puras). `normalizarNombre` quita los espacios del principio y del final y deja en uno los espacios seguidos. Así se guarda el nombre, con sus mayúsculas y tildes. `claveDeNombre` pasa a minúsculas, quita las tildes y cambia por un guion cada tramo de caracteres que no sea letra ni número: `Piso Lavapiés` da `piso-lavapies`. Dos nombres son el mismo si tienen la misma clave. Un nombre con la clave vacía no vale.
- **Grupo** (`crearGrupo(nombre, miembros)`). Valida y devuelve `{ ok: true, grupo }` o `{ ok: false, error }` con el mensaje en español. Orden de las comprobaciones: nombre vacío, nombre sin letras ni números, miembro vacío, miembro sin letras ni números, menos de 2 miembros, miembros repetidos. Los miembros se guardan en el orden en que se escribieron.
- **Almacén** (`src/almacen.ts`, único módulo que toca ficheros). La carpeta de datos es `CUENTAS_DIR` si tiene valor, o `.cuentas` en la carpeta de trabajo. Se crea si no existe. Cada grupo va en `<clave del nombre>.json`, con `{ "nombre", "miembros" }`, dos espacios de sangría y salto de línea final. Se escribe con el flag `wx`: si el fichero ya existe, devuelve que el grupo existe y no lo toca. Cualquier otro error del sistema se propaga.
- **Opciones** (`src/argumentos.ts`). `leerArgumentos(args, permitidas)` separa posicionales y opciones `--nombre valor` o `--nombre=valor`. Rechaza opciones desconocidas, repetidas o sin valor con un mensaje en español.
- **Orden** (`src/ordenes/grupo-crear.ts`). Lee los argumentos, exige un solo posicional (el nombre) y `--miembros`, parte la lista por comas, llama a `crearGrupo` y después al almacén. Los errores de argumentos terminan con la línea `Uso: pnpm cuentas grupo crear "<nombre>" --miembros Ana,Bea,Carlos`. Si el almacén lanza un error, devuelve `No se pudo guardar el grupo en <carpeta>: <mensaje>`. La confirmación enumera los miembros en español: `Ana, Bea y Carlos`, con `e` delante de un nombre que empieza por el sonido i (`Bea e Inés`).
- **CLI** (`src/cli.ts`). `ejecutar(args, env = process.env)`. Una tabla de órdenes con `palabras`, `uso`, `descripcion` y la función que la ejecuta. Se busca la orden por sus palabras (`grupo crear`), sin indexar objetos con lo que escribe el usuario. `ayuda()` se genera con esa tabla. Las órdenes futuras (`gasto anotar`…) solo añaden una fila y su fichero en `src/ordenes/`.
- Los tipos compartidos (`Resultado`, `Contexto`, `Orden`) van en `src/ordenes/orden.ts`. `src/cli.ts` vuelve a exportar `Resultado`.

## Expected File Changes

- `src/dominio/grupo.ts` — create: reglas del grupo y comparación de nombres.
- `src/almacen.ts` — create: carpeta de datos y fichero del grupo.
- `src/argumentos.ts` — create: lectura de opciones.
- `src/ordenes/orden.ts` — create: tipos compartidos de las órdenes.
- `src/ordenes/grupo-crear.ts` — create: la orden `grupo crear`.
- `src/cli.ts` — modify: tabla de órdenes, entorno y ayuda generada.
- `tests/grupo.test.ts`, `tests/argumentos.test.ts`, `tests/grupo-crear.test.ts` — create.
- `tests/cli.test.ts` — modify: la ayuda incluye `grupo crear` y las órdenes incompletas.
- `ARCHITECTURE.md`, `AGENTS.md`, `docs/domain-model.md`, `docs/risks-and-open-questions.md` — ver Durable Documentation Impact.
- `feature_list.json`, `PROGRESS.md` — modify: estado y evidencia.

## Visual Design Impact

- UI involved: no. Es texto en la terminal.
- Design source: no aplica.
- Screens or states affected: ninguno.
- New design artifact required: no.

## Durable Documentation Impact

- `ARCHITECTURE.md`: create — esta feature fija las capas (CLI, órdenes, dominio, almacén), la dirección de las dependencias y dónde se guardan los datos. Las features siguientes tienen que seguirlas.
- `CONSTRAINTS.md`: not needed — las reglas MUST/MUST NOT nuevas son de límites entre capas y de rutas de datos, y van en `ARCHITECTURE.md` junto a lo que regulan. Las generales ya están en `AGENTS.md`.
- `AGENTS.md`: update — añadir `ARCHITECTURE.md` a la lista de lectura. Sin esa línea, un agente nuevo no sabe que existe. El flujo de trabajo no cambia.
- `docs/domain-model.md`: update — en la regla 3, cuándo dos nombres son el mismo. Nueva regla 11: dos grupos no pueden tener el mismo nombre.
- `docs/risks-and-open-questions.md`: update — quitar las dos preguntas que cierra esta spec.
- `README.md`: not needed — la ayuda de la CLI ya documenta la orden.
- `init.sh`: not needed — ya ejecuta el gate completo.

## Implementation Plan

1. Dominio: `normalizarNombre`, `claveDeNombre` y `crearGrupo`, con sus tests (escenarios 2 a 6).
2. Lectura de opciones con sus tests.
3. Almacén y orden `grupo crear`, con tests de `ejecutar` contra una carpeta temporal (escenarios 1 a 10).
4. Tabla de órdenes y ayuda generada en `src/cli.ts` (escenario 11).
5. Documentación durable, `./init.sh`, prueba a mano y evidencia.

## Implementation Tasks

- [ ] `src/dominio/grupo.ts` con `Grupo`, `normalizarNombre`, `claveDeNombre` y `crearGrupo`.
- [ ] `tests/grupo.test.ts`: normalización, claves (incluida `../fuera`), mínimo de 2, vacíos, repetidos exactos y por mayúsculas o tildes.
- [ ] `src/argumentos.ts` y `tests/argumentos.test.ts`.
- [ ] `src/almacen.ts` con `carpetaDeDatos` y `guardarGrupoNuevo` (flag `wx`).
- [ ] `src/ordenes/orden.ts` y `src/ordenes/grupo-crear.ts`.
- [ ] `src/cli.ts`: `ejecutar(args, env)`, tabla de órdenes, `ayuda()` generada.
- [ ] `tests/grupo-crear.test.ts` con una carpeta temporal por test en `CUENTAS_DIR`, y `tests/cli.test.ts` ampliado.
- [ ] `ARCHITECTURE.md`, `AGENTS.md`, `docs/domain-model.md` y `docs/risks-and-open-questions.md`.
- [ ] `./init.sh`, prueba a mano, evidencia en `feature_list.json` y `PROGRESS.md`.

## Verification Plan

- `./init.sh` termina con código 0: instala con el lockfile, `pnpm typecheck` sin errores y `pnpm test` en verde. No arranca ningún proceso largo.
- Los tests de `tests/grupo-crear.test.ts` cubren los escenarios 1 a 11 con `ejecutar` y una carpeta temporal, y comprueban en cada error que no se ha creado ningún fichero.
- Prueba a mano en una carpeta temporal:
  - `CUENTAS_DIR=$(mktemp -d) pnpm cuentas grupo crear "Piso Lavapiés" --miembros Ana,Bea,Carlos` muestra la confirmación y crea `piso-lavapies.json`.
  - Repetir la orden en la misma carpeta da `Ya existe un grupo…` con código 1.
- E2E: el repo no tiene comando E2E. No hace falta: `main.ts` solo conecta `ejecutar` con la terminal y la prueba a mano cubre esa conexión.

## Evidence To Capture

- Resumen de `./init.sh`: código de salida y número de tests.
- Ficheros de test que cubren los escenarios.
- Salida de la prueba a mano y contenido del fichero creado.

## Validator Checklist

- [ ] Implementación dentro del alcance: sin gastos, saldos, pagos ni lectura de grupos.
- [ ] Los escenarios 1 a 11 pasan.
- [ ] El dominio no importa módulos de Node y solo `src/almacen.ts` toca ficheros.
- [ ] La ruta del fichero sale de `claveDeNombre`, nunca del nombre tal cual, y crear un grupo nunca sobrescribe otro.
- [ ] Ningún test escribe en la `.cuentas/` del repo.
- [ ] Sin dependencias nuevas en `package.json`.
- [ ] Mensajes en español con los términos de `CONTEXT.md`.
- [ ] Documentación durable según lo indicado. `AGENTS.md` sigue siendo corto.
- [ ] Evidencia en `feature_list.json` y `PROGRESS.md`. `./init.sh` sigue pasando.
