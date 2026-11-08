// Único módulo que lee o escribe ficheros. Cada grupo se guarda en <clave del nombre>.json
// dentro de la carpeta de datos.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import type { Gasto, GrupoConGastos } from "./dominio/gasto.ts";
import { claveDeNombre, type Grupo } from "./dominio/grupo.ts";

export const CARPETA_POR_DEFECTO = ".cuentas";

export type Entorno = Readonly<Record<string, string | undefined>>;

// CUENTAS_DIR si tiene valor. Si no, .cuentas en la carpeta de trabajo.
export function carpetaDeDatos(entorno: Entorno): string {
  return resolve(entorno.CUENTAS_DIR || CARPETA_POR_DEFECTO);
}

// La ruta sale siempre de la clave, nunca del nombre tal cual, así que no sale de la carpeta.
export function rutaDelGrupo(carpeta: string, nombre: string): string {
  return join(carpeta, `${claveDeNombre(nombre)}.json`);
}

// Crea el fichero del grupo sin sobrescribir nunca otro. Devuelve "ya-existe" si ya hay
// un grupo con la misma clave. Cualquier otro error del sistema se propaga.
export function guardarGrupoNuevo(carpeta: string, grupo: Grupo): "creado" | "ya-existe" {
  mkdirSync(carpeta, { recursive: true });
  try {
    writeFileSync(rutaDelGrupo(carpeta, grupo.nombre), `${JSON.stringify(grupo, null, 2)}\n`, { flag: "wx" });
    return "creado";
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "EEXIST") {
      return "ya-existe";
    }
    throw error;
  }
}

export type LecturaDeGrupo =
  | { estado: "leido"; grupo: GrupoConGastos }
  | { estado: "no-existe" }
  | { estado: "ilegible"; detalle: string };

// Lee el grupo con ese nombre. Un fichero creado antes de anotar-gasto no tiene "gastos":
// se lee con la lista vacía. Si el fichero está roto o tiene datos imposibles, lo dice en
// "detalle" en lugar de lanzar. Cualquier otro error del sistema se propaga.
export function leerGrupo(carpeta: string, nombre: string): LecturaDeGrupo {
  let texto: string;
  try {
    texto = readFileSync(rutaDelGrupo(carpeta, nombre), "utf8");
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return { estado: "no-existe" };
    }
    throw error;
  }
  let datos: unknown;
  try {
    datos = JSON.parse(texto);
  } catch {
    return { estado: "ilegible", detalle: "no es JSON válido" };
  }
  const validacion = validarGrupo(datos, nombre);
  return typeof validacion === "string" ? { estado: "ilegible", detalle: validacion } : { estado: "leido", grupo: validacion };
}

// Sobrescribe el fichero de un grupo que ya existe, con el mismo formato que al crearlo.
export function guardarGrupo(carpeta: string, grupo: GrupoConGastos): void {
  writeFileSync(rutaDelGrupo(carpeta, grupo.nombre), `${JSON.stringify(grupo, null, 2)}\n`);
}

// Devuelve el grupo o un texto con lo que está mal.
function validarGrupo(datos: unknown, nombreBuscado: string): GrupoConGastos | string {
  if (!esObjeto(datos)) return "no es un objeto";
  const { nombre, miembros, gastos = [] } = datos;
  if (typeof nombre !== "string" || claveDeNombre(nombre) !== claveDeNombre(nombreBuscado)) {
    return "el nombre guardado no coincide con el del fichero";
  }
  if (!Array.isArray(miembros) || miembros.length < 2 || !miembros.every((m) => typeof m === "string")) {
    return '"miembros" tiene que ser una lista de al menos 2 nombres';
  }
  if (new Set(miembros.map(claveDeNombre)).size !== miembros.length) return "hay miembros repetidos";
  if (!Array.isArray(gastos)) return '"gastos" tiene que ser una lista';
  const ids = new Set<number>();
  for (const gasto of gastos) {
    const problema = problemaDelGasto(gasto, miembros, ids);
    if (problema !== undefined) return problema;
  }
  return { nombre, miembros, gastos: gastos as Gasto[] };
}

function problemaDelGasto(gasto: unknown, miembros: readonly string[], ids: Set<number>): string | undefined {
  if (!esObjeto(gasto)) return "hay un gasto que no es un objeto";
  const { id, concepto, importeCentimos, pagador, participantes } = gasto;
  if (typeof id !== "number" || !Number.isSafeInteger(id) || id < 1 || ids.has(id)) {
    return `el gasto ${JSON.stringify(id)} no tiene un id entero positivo y único`;
  }
  ids.add(id);
  if (typeof concepto !== "string" || concepto.trim() === "") return `el gasto ${id} no tiene concepto`;
  if (typeof importeCentimos !== "number" || !Number.isSafeInteger(importeCentimos) || importeCentimos <= 0) {
    return `el gasto ${id} no tiene un importe en céntimos mayor que cero`;
  }
  if (typeof pagador !== "string" || !miembros.includes(pagador)) return `el pagador del gasto ${id} no es miembro del grupo`;
  if (
    !Array.isArray(participantes) ||
    participantes.length === 0 ||
    !participantes.every((p) => typeof p === "string" && miembros.includes(p)) ||
    new Set(participantes).size !== participantes.length
  ) {
    return `los participantes del gasto ${id} no son miembros distintos del grupo`;
  }
  return undefined;
}

function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === "object" && valor !== null && !Array.isArray(valor);
}
