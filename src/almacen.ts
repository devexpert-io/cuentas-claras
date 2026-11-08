// Único módulo que lee o escribe ficheros. Cada grupo se guarda en <clave del nombre>.json
// dentro de la carpeta de datos.

import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
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
