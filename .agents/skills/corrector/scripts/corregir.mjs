#!/usr/bin/env node
// Corrector del curso: comprobaciones fijas y una revisión con rúbrica hecha por un modelo.
//
//   node .agents/skills/corrector/scripts/corregir.mjs <ejercicio> [fichero]
//
// <ejercicio> es el número del ejercicio. Qué es [fichero] depende de cada ejercicio.
//
// Necesita la clave del curso en DEVEXPERT_API_KEY. Opcionales: DEVEXPERT_BASE_URL y DEVEXPERT_MODEL.
// Sale con 0 si el veredicto es accept y con 1 si es revise.
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { llamarModelo } from "./modelo.mjs";
import { esElPrincipal } from "./plataforma.mjs";

export const EJERCICIOS = {
  1: "./ejercicios/1.mjs",
  2: "./ejercicios/2.mjs",
  3: "./ejercicios/3.mjs",
  4: "./ejercicios/4.mjs",
};

export async function corregir(ejercicio, { raiz = process.cwd(), fichero, modelo = llamarModelo, ...extra } = {}) {
  const ruta = EJERCICIOS[String(ejercicio)];
  if (!ruta) throw new Error(`Este corrector todavía no sabe corregir el ejercicio ${ejercicio}.`);
  const { corregirEjercicio } = await import(ruta);
  return corregirEjercicio({ raiz: resolve(raiz), fichero, modelo, ...extra });
}

async function main() {
  const [ejercicio, fichero] = process.argv.slice(2);
  if (!ejercicio) {
    console.error("Uso: corregir.mjs <ejercicio> [fichero]");
    process.exit(2);
  }
  if (fichero && !existsSync(fichero)) {
    console.error(`No encuentro ${fichero}.`);
    process.exit(2);
  }
  try {
    const informe = await corregir(ejercicio, { fichero });
    console.log(informe.texto);
    process.exitCode = informe.veredicto === "accept" ? 0 : 1;
  } catch (e) {
    console.error(`El corrector no ha podido terminar: ${e.message}`);
    process.exitCode = 2;
  }
}

if (esElPrincipal(import.meta.url)) await main();
