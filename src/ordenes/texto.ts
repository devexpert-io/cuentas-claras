// Textos que comparten varias órdenes de la CLI.

import { claveDeNombre } from "../dominio/grupo.ts";

// "Ana, Bea y Carlos". Delante de un nombre que empieza por el sonido i va "e": "Bea e Inés".
export function enumerar(nombres: readonly string[]): string {
  const ultimo = nombres[nombres.length - 1];
  if (nombres.length < 2 || ultimo === undefined) {
    return nombres.join("");
  }
  const conjuncion = /^h?i([^aeiou]|$)/.test(claveDeNombre(ultimo)) ? "e" : "y";
  return `${nombres.slice(0, -1).join(", ")} ${conjuncion} ${ultimo}`;
}
