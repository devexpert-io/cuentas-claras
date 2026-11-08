// Lectura de las entregas en Markdown de los ejercicios 1, 2 y 3 (ejercicios/entregas/NN-*.md).
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { seccion, secciones } from "./spec.mjs";

export const SKILL = resolve(dirname(fileURLToPath(import.meta.url)), "..");

export const sinTildes = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

/** Quita los comentarios HTML, que en las plantillas llevan las instrucciones. */
export const sinComentarios = (md) => md.replace(/<!--[\s\S]*?-->/g, "");

/** Secciones de la entrega, ya sin comentarios. Devuelve una función que busca por nombre. */
export function partesDe(md) {
  const partes = secciones(sinComentarios(md));
  return (...nombres) => seccion(partes, nombres)?.cuerpo ?? null;
}

/** Texto escrito por el alumno en una sección: sin citas vacías, sin líneas en blanco al principio ni al final. */
export const texto = (cuerpo) =>
  (cuerpo ?? "")
    .split("\n")
    .map((l) => l.replace(/^\s*>\s?/, ""))
    .join("\n")
    .trim();

/** Campos "- Nombre: valor" de una sección → Map con el nombre sin tildes ni mayúsculas, y sin lo que va entre paréntesis. */
export function campos(cuerpo) {
  const m = new Map();
  for (const linea of (cuerpo ?? "").split("\n")) {
    const r = /^\s*[-*]\s+([^:]+?)\s*:\s*(.*)$/.exec(linea);
    if (r) m.set(sinTildes(r[1].replace(/\(.*?\)/g, "")).replace(/\s+/g, " "), r[2].trim());
  }
  return m;
}

/** ¿Está sin rellenar? Vacío o con un marcador de la plantilla. */
export const vacio = (valor) => !valor || /^[\s._…\-–—?]*$/.test(valor) || /^\(.*\)$/.test(valor.trim());

/** Un número entero de tokens escrito a la española o a la inglesa: 9.708, 9,708, 9 708 o 9708. */
export function entero(valor) {
  const m = /\d[\d.,\s]*/.exec(valor ?? "");
  if (!m) return null;
  const n = Number(m[0].replace(/[.,\s]/g, ""));
  return Number.isFinite(n) ? n : null;
}

/** Un importe en dólares: 0,0043 $, $0.0043 o 0.0043. */
export function importe(valor) {
  const m = /\d[\d.,]*/.exec(valor ?? "");
  if (!m) return null;
  let t = m[0];
  if (t.includes(",")) t = t.replace(/\./g, "").replace(",", ".");
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

/** Bloques de código de una sección → [{ lenguaje, codigo }]. */
export function bloques(cuerpo) {
  const salida = [];
  const re = /```(\w*)[^\n]*\n([\s\S]*?)```/g;
  let m;
  while ((m = re.exec(cuerpo ?? ""))) salida.push({ lenguaje: m[1].toLowerCase(), codigo: m[2].trim() });
  return salida;
}

/** URLs http(s) de un texto. */
export const urls = (t) => [...(t ?? "").matchAll(/https?:\/\/[^\s)>\]"'`]+/g)].map((m) => m[0].replace(/[.,;:]+$/, ""));

export const lineasDeFijas = (fijas) => fijas.map((f) => `  ${f.ok ? "✓" : "✗"} ${f.t.replace(/\n/g, "\n    ")}`);
