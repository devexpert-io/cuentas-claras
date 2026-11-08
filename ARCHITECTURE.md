# Arquitectura

Cuentas claras es una CLI de Node escrita en TypeScript, sin dependencias de ejecución. Aquí están las capas, hacia dónde van las dependencias y dónde se guardan los datos. Lo que hace cada orden está en su spec, en `docs/specs/`.

## Capas

Cada línea importa solo de las que tiene debajo:

```text
src/main.ts                  la terminal: process.argv, salida y código de salida
  └─ src/cli.ts              ejecutar(args, entorno): busca la orden en la tabla y devuelve { salida, codigo }
       └─ src/ordenes/       una orden por fichero: lee opciones, llama al dominio y al almacén, redacta los mensajes
            ├─ src/argumentos.ts    lectura de opciones, común a todas las órdenes
            ├─ src/almacen.ts       ficheros JSON en la carpeta de datos
            └─ src/dominio/         reglas de docs/domain-model.md en funciones puras
```

- `src/dominio/` no importa módulos de Node ni de las otras capas. Recibe datos y devuelve un resultado o un error con su mensaje en español.
- `src/almacen.ts` es el único módulo que lee o escribe ficheros. Del dominio solo usa `claveDeNombre`.
- `src/ordenes/` une las piezas, pero no contiene reglas de dominio. Un error del usuario no es una excepción: la orden devuelve `codigo: 1` y un mensaje claro.
- Todo menos `src/main.ts` se prueba sin lanzar procesos, a través de `ejecutar`.

## Datos

- La carpeta de datos es la de `CUENTAS_DIR` o, si no tiene valor, `.cuentas/` en la carpeta de trabajo. Con `pnpm cuentas`, la carpeta de trabajo es la raíz del proyecto.
- Cada grupo va en su propio fichero JSON, con el nombre que da `claveDeNombre`: `Piso Lavapiés` se guarda en `piso-lavapies.json`.
- Las rutas de datos se construyen siempre con `claveDeNombre`, nunca con lo que escribe el usuario tal cual. Así ningún nombre puede apuntar fuera de la carpeta de datos.
- Crear un fichero de datos nunca sobrescribe otro: se escribe con el flag `wx`.
- Las features que añadan datos a un grupo (gastos, pagos) amplían su fichero y tienen que aceptar los ficheros creados antes, que no tienen esos campos.

## Añadir una orden

1. Crear `src/ordenes/<orden>.ts` con una función del tipo `Orden` (`src/ordenes/orden.ts`).
2. Añadir una fila a la tabla de órdenes de `src/cli.ts` con sus palabras, su uso y su descripción. La ayuda sale de esa tabla.
3. Leer las opciones con `leerArgumentos`, que rechaza las que la orden no conoce.
4. Probarla a través de `ejecutar`, con una carpeta temporal en `CUENTAS_DIR`.
