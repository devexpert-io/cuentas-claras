#!/usr/bin/env node
// Calibra el corrector: corrige cada spec de pruebas/ varias veces y compara con pruebas/esperado.json.
// Uso: node .agents/skills/corrector/scripts/calibrar.mjs [vueltas]   (usa la clave de DEVEXPERT_API_KEY)
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { corregir } from "./corregir.mjs";

const PRUEBAS = resolve(dirname(fileURLToPath(import.meta.url)), "..", "pruebas");
const esperado = JSON.parse(readFileSync(join(PRUEBAS, "esperado.json"), "utf8").replace(/\r\n/g, "\n"));
const vueltas = Number(process.argv[2] ?? 3);

let fallos = 0;
for (const [spec, e] of Object.entries(esperado)) {
  for (let v = 1; v <= vueltas; v++) {
    const r = await corregir(5, { raiz: join(PRUEBAS, "proyecto"), fichero: join(PRUEBAS, spec) });
    const okVeredicto = r.veredicto === e.veredicto;
    const okMarcados = !e.marcados || JSON.stringify(r.marcados) === JSON.stringify(e.marcados);
    if (!okVeredicto || !okMarcados) fallos++;
    console.log(`${okVeredicto && okMarcados ? "✓" : "✗"} ${spec} vuelta ${v}: ${r.veredicto}, marcados [${r.marcados}]`);
    if (!okVeredicto || !okMarcados) console.log(r.texto.replace(/^/gm, "    "));
  }
}
console.log(fallos ? `${fallos} discrepancias` : "Todo coincide con lo esperado");
process.exitCode = fallos ? 1 : 0;
