// La CLI como función: recibe los argumentos y el entorno, y devuelve lo que hay que mostrar.
// Así se prueba sin lanzar procesos. src/main.ts la conecta con la terminal.

import { carpetaDeDatos, type Entorno } from "./almacen.ts";
import { gastoAnotar, USO_GASTO_ANOTAR } from "./ordenes/gasto-anotar.ts";
import { grupoCrear, USO_GRUPO_CREAR } from "./ordenes/grupo-crear.ts";
import type { Orden, Resultado } from "./ordenes/orden.ts";

export type { Resultado } from "./ordenes/orden.ts";

interface DefinicionDeOrden {
  palabras: readonly string[];
  uso: string;
  descripcion: string;
  ejecutar: Orden;
}

// Para añadir una orden: una fila aquí y su fichero en src/ordenes/. La ayuda sale de esta tabla.
const ORDENES: readonly DefinicionDeOrden[] = [
  {
    palabras: ["grupo", "crear"],
    uso: USO_GRUPO_CREAR,
    descripcion: "crea un grupo con sus miembros",
    ejecutar: grupoCrear,
  },
  {
    palabras: ["gasto", "anotar"],
    uso: USO_GASTO_ANOTAR,
    descripcion: "anota un gasto repartido a partes iguales",
    ejecutar: gastoAnotar,
  },
];

export function ayuda(): string {
  const filas = [{ uso: "ayuda", descripcion: "muestra esta ayuda" }, ...ORDENES];
  const ancho = Math.max(...filas.map((fila) => fila.uso.length));
  return [
    "cuentas: reparte los gastos de un grupo",
    "",
    "Uso: pnpm cuentas <orden> [opciones]",
    "",
    "Órdenes:",
    ...filas.map((fila) => `  ${fila.uso.padEnd(ancho)}  ${fila.descripcion}`),
    "",
    "Los datos se guardan en .cuentas/, en la carpeta desde la que se ejecuta.",
    "Para usar otra carpeta, define la variable de entorno CUENTAS_DIR.",
  ].join("\n");
}

export function ejecutar(args: string[], entorno: Entorno = process.env): Resultado {
  const [primera] = args;
  if (primera === undefined || primera === "ayuda" || primera === "--help") {
    return { salida: ayuda(), codigo: 0 };
  }
  const orden = ORDENES.find((definicion) => definicion.palabras.every((palabra, i) => args[i] === palabra));
  if (orden === undefined) {
    return { salida: `Orden desconocida: ${ordenEscrita(args)}\n\n${ayuda()}`, codigo: 1 };
  }
  return orden.ejecutar(args.slice(orden.palabras.length), { carpetaDeDatos: carpetaDeDatos(entorno) });
}

// La orden tal como se escribió: una palabra, o dos si la primera es la de un grupo de órdenes.
function ordenEscrita(args: readonly string[]): string {
  const deVariasPalabras = ORDENES.some(
    (definicion) => definicion.palabras.length > 1 && definicion.palabras[0] === args[0],
  );
  return args.slice(0, deVariasPalabras ? 2 : 1).join(" ");
}
