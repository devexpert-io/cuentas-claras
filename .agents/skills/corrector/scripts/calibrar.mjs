#!/usr/bin/env node
// Calibra el corrector: corrige varias veces cada entrega de pruebas/ejercicio-N/ y compara con su esperado.json.
// Uso: node .agents/skills/corrector/scripts/calibrar.mjs [vueltas] [ejercicio...]   (usa la clave de DEVEXPERT_API_KEY)
//
// Cada clave de esperado.json es un caso. Se comparan todos los campos que pone el esperado (veredicto,
// marcados, cobertura...). Si el módulo del ejercicio exporta prepararCaso, prepara él el proyecto del caso.
// Si no, el caso es un fichero de pruebas/ejercicio-N/ y el proyecto es pruebas/ejercicio-N/proyecto.
// Las pruebas del ejercicio 5 están todavía sueltas en pruebas/, sin carpeta propia.
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { corregir, EJERCICIOS } from "./corregir.mjs";

const PRUEBAS = resolve(dirname(fileURLToPath(import.meta.url)), "..", "pruebas");
const leerJson = (ruta) => (existsSync(ruta) ? JSON.parse(readFileSync(ruta, "utf8").replace(/\r\n/g, "\n")) : null);

const [vueltasTexto, ...pedidos] = process.argv.slice(2);
const vueltas = Number(vueltasTexto ?? 3);
const ejercicios = pedidos.length ? pedidos : Object.keys(EJERCICIOS);

let fallos = 0;
for (const ejercicio of ejercicios) {
  let carpeta = join(PRUEBAS, `ejercicio-${ejercicio}`);
  if (!existsSync(carpeta) && String(ejercicio) === "5") carpeta = PRUEBAS;
  const esperado = leerJson(join(carpeta, "esperado.json"));
  if (!esperado) {
    console.log(`· ejercicio ${ejercicio}: sin pruebas`);
    continue;
  }
  const modulo = await import(EJERCICIOS[ejercicio]);
  for (const [caso, e] of Object.entries(esperado)) {
    const preparado = modulo.prepararCaso
      ? await modulo.prepararCaso({ carpeta, caso })
      : { raiz: join(carpeta, "proyecto"), fichero: join(carpeta, caso) };
    try {
      for (let v = 1; v <= vueltas; v++) {
        const { limpiar, ...opciones } = preparado;
        const r = await corregir(ejercicio, opciones);
        const distintos = Object.keys(e).filter((k) => JSON.stringify(r[k]) !== JSON.stringify(e[k]));
        if (distintos.length) fallos++;
        const resumen = Object.keys(e).map((k) => `${k} ${JSON.stringify(r[k])}`).join(", ");
        console.log(`${distintos.length ? "✗" : "✓"} ejercicio ${ejercicio} · ${caso} · vuelta ${v}: ${resumen}`);
        if (distintos.length) console.log(r.texto.replace(/^/gm, "    "));
      }
    } finally {
      preparado.limpiar?.();
    }
  }
}
console.log(fallos ? `${fallos} discrepancias` : "Todo coincide con lo esperado");
process.exitCode = fallos ? 1 : 0;
