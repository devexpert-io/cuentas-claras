// Importes en céntimos enteros (regla 1 de docs/domain-model.md). Funciones puras.

export type LecturaDeImporte = { ok: true; centimos: number } | { ok: false; error: string };

// Dígitos y, si hay decimales, una coma o un punto con uno o dos dígitos: 12, 12,5, 12.50.
const FORMATO = /^(\d+)(?:[.,](\d{1,2}))?$/;

// Lee un importe escrito en euros y lo devuelve en céntimos sin pasar por decimales.
export function parsearImporte(texto: string): LecturaDeImporte {
  const limpio = texto.trim();
  if (/^-\s*\d/.test(limpio)) {
    return fallo("El importe tiene que ser mayor que cero.");
  }
  const partes = FORMATO.exec(limpio);
  if (partes === null) {
    return fallo(`El importe "${limpio}" no es válido. Escríbelo en euros con como mucho dos decimales, por ejemplo 12,50.`);
  }
  const [, euros = "", decimales = ""] = partes;
  const centimos = Number(euros) * 100 + Number(decimales.padEnd(2, "0"));
  if (!Number.isSafeInteger(centimos)) {
    return fallo(`El importe "${limpio}" es demasiado grande.`);
  }
  if (centimos <= 0) {
    return fallo("El importe tiene que ser mayor que cero.");
  }
  return { ok: true, centimos };
}

// 1250 → "12,50 €". Admite negativos: -334 → "-3,34 €".
export function formatearImporte(centimos: number): string {
  const signo = centimos < 0 ? "-" : "";
  const absoluto = Math.abs(centimos);
  const euros = Math.floor(absoluto / 100);
  const resto = String(absoluto % 100).padStart(2, "0");
  return `${signo}${euros},${resto} €`;
}

function fallo(error: string): LecturaDeImporte {
  return { ok: false, error };
}
