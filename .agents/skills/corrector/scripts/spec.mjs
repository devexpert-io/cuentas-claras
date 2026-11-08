// Lectura de una spec en Markdown: secciones de nivel 2 y escenarios de nivel 3.

const sinTildes = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

/** Secciones "## Título" → [{ titulo, cuerpo }]. */
export function secciones(md) {
  const salida = [];
  let actual = null;
  for (const linea of md.split("\n")) {
    const m = /^##\s+(.+?)\s*$/.exec(linea);
    if (m && !linea.startsWith("###")) {
      actual = { titulo: m[1], cuerpo: "" };
      salida.push(actual);
    } else if (actual) {
      actual.cuerpo += `${linea}\n`;
    }
  }
  return salida;
}

/** Busca una sección por cualquiera de sus nombres (sin mirar tildes ni mayúsculas). */
export function seccion(lista, nombres) {
  const buscados = nombres.map(sinTildes);
  return lista.find((s) => buscados.some((n) => sinTildes(s.titulo).startsWith(n)));
}

/** Escenarios "### Título" dentro de una sección. */
export function escenarios(cuerpo) {
  const salida = [];
  let actual = null;
  for (const linea of cuerpo.split("\n")) {
    const m = /^###\s+(.+?)\s*$/.exec(linea);
    if (m) {
      actual = { titulo: m[1], texto: "" };
      salida.push(actual);
    } else if (actual) {
      actual.texto += `${linea}\n`;
    }
  }
  return salida.map((e, i) => ({ n: i + 1, titulo: e.titulo, texto: e.texto.trim() }));
}

const PALABRA = (re) => new RegExp(`(^|[\\s*_>\`-])(${re})\\b`, "im");
export const tieneGiven = (t) => PALABRA("given|dad[oa]s?").test(t);
export const tieneWhen = (t) => PALABRA("when|cuando").test(t);
export const tieneThen = (t) => PALABRA("then|entonces").test(t);

/** Líneas de lista ("- " o "* ") de un cuerpo. */
export const vinetas = (cuerpo) => cuerpo.split("\n").filter((l) => /^\s*[-*]\s+\S/.test(l)).length;

/** ¿Hay algún comando entre comillas invertidas? */
export const tieneComando = (cuerpo) => /`[^`]*(pnpm|npm|npx|node|vitest|\.\/init\.sh|cuentas|bun|deno|python|pytest|go test|cargo)[^`]*`/i.test(cuerpo);

/** Id de la feature en "## Source Feature": - `id`: anotar-gasto */
export function idDeFeature(cuerpo) {
  const m = /`?id`?\s*:\s*`?([\w.-]+)`?/i.exec(cuerpo);
  return m ? m[1] : null;
}
