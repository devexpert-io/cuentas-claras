// Utilidades comunes de los correctores que miran el proyecto: comandos, tests ocultos y proyectos de prueba.
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { tmpdir } from "node:os";
import { basename, dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { bash, conBarras, lanzar } from "./plataforma.mjs";

export const SKILL = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const PRUEBAS = join(SKILL, "pruebas");
// Raíz del repo en el que está instalada la skill (.agents/skills/corrector → ../../..).
export const REPO = resolve(SKILL, "..", "..", "..");

export const leerJson = (ruta) => (existsSync(ruta) ? JSON.parse(readFileSync(ruta, "utf8").replace(/\r\n/g, "\n")) : null);

/** Ejecuta un comando sin shell y devuelve { codigo, salida } con stdout y stderr juntos. */
export function ejecutarEn(raiz, comando, args = [], opciones = {}) {
  const r = lanzar(comando, args, {
    cwd: raiz,
    encoding: "utf8",
    env: { ...process.env, CI: "1", FORCE_COLOR: "0", NO_COLOR: "1", ...opciones.env },
    timeout: opciones.timeout ?? 300_000,
    maxBuffer: 20 * 1024 * 1024,
  });
  return { codigo: r.status ?? 1, salida: `${r.stdout ?? ""}${r.stderr ?? ""}${r.error ? `\n${r.error.message}` : ""}` };
}

const ultimasLineas = (texto, n = 8) => texto.trim().split("\n").slice(-n).join("\n");

/** ./init.sh si existe y, si no, pnpm test. */
export function comprobarInit(raiz) {
  if (existsSync(join(raiz, "init.sh"))) {
    const r = ejecutarEn(raiz, bash(), ["./init.sh"]);
    return r.codigo === 0
      ? { ok: true, t: "./init.sh termina con código 0" }
      : { ok: false, t: `./init.sh falla (código ${r.codigo}):\n${sangrar(resumenDeFallo(r.salida))}` };
  }
  const r = ejecutarEn(raiz, "pnpm", ["test"]);
  return r.codigo === 0 ? { ok: true, t: "pnpm test pasa" } : { ok: false, t: `pnpm test falla (código ${r.codigo})` };
}

// Las líneas que dicen qué ha fallado (tests o tipos) o, si no hay, las últimas.
function resumenDeFallo(salida) {
  const utiles = [...new Set(salida.split("\n").map((l) => l.trim()).filter((l) => /^(FAIL\s|×|✗|.*error TS\d+)/.test(l)))];
  return utiles.length ? utiles.slice(0, 8).join("\n") : ultimasLineas(salida);
}

const sangrar = (texto) => texto.replace(/^/gm, "      ");

/**
 * Pasa unos tests del curso que el alumno no ha visto. Copia el fichero a tests/ con un nombre propio,
 * lo ejecuta con el vitest del proyecto y lo borra. Devuelve { ok, fallos: [títulos] }.
 */
export function pasarTestsOcultos(raiz, fichero) {
  const destino = join(raiz, "tests", `__corrector-${basename(fichero).replace(/\.ts$/, "")}.test.ts`);
  const informe = join(mkdtempSync(join(tmpdir(), "corrector-")), "informe.json");
  mkdirSync(dirname(destino), { recursive: true });
  copyFileSync(fichero, destino);
  try {
    const r = ejecutarEn(raiz, "pnpm", ["exec", "vitest", "run", conBarras(relative(raiz, destino)), "--reporter=json", `--outputFile=${informe}`]);
    const datos = leerJson(informe);
    if (!datos) return { ok: false, fallos: [`no se han podido ejecutar: ${ultimasLineas(r.salida, 3)}`] };
    const fallos = datos.testResults.flatMap((f) =>
      f.assertionResults.length
        ? f.assertionResults.filter((a) => a.status !== "passed").map((a) => a.title)
        : [`el fichero de tests no se ha podido cargar: ${(f.message ?? "").split("\n")[0]}`],
    );
    return { ok: r.codigo === 0 && fallos.length === 0, fallos };
  } finally {
    rmSync(destino, { force: true });
    rmSync(dirname(informe), { recursive: true, force: true });
  }
}

/** Comprobación fija con los tests ocultos de un ejercicio. */
export function comprobarTestsOcultos(raiz, fichero, nombre) {
  const r = pasarTestsOcultos(raiz, fichero);
  if (r.ok) return { ok: true, t: `Pasan los tests del curso para ${nombre}` };
  return { ok: false, t: `Fallan tests del curso para ${nombre}:\n${r.fallos.map((f) => `      - ${f}`).join("\n")}` };
}

const FUERA_DE_LA_BASE = new Set(["src", "tests", "node_modules", ".agents", ".claude", ".git", ".cuentas"]);

/**
 * Proyecto de prueba para calibrar: los ficheros del repo (sin src/ ni tests/), encima las capas de
 * pruebas/ en orden y después los parches. Devuelve { raiz, limpiar }.
 * Cada capa es un .tar.gz de pruebas/ (sin la extensión en la llamada): así ni vitest ni tsc ni las
 * búsquedas del agente ven su código dentro del repo del alumno.
 */
export function proyectoDePrueba({ capas = [], parches = [] }) {
  const raiz = mkdtempSync(join(tmpdir(), "corrector-proyecto-"));
  const listado = ejecutarEn(REPO, "git", ["ls-files", "-z"]).salida.split("\0").filter(Boolean);
  for (const fichero of listado) {
    if (FUERA_DE_LA_BASE.has(fichero.split("/")[0]) || !existsSync(join(REPO, fichero))) continue;
    mkdirSync(dirname(join(raiz, fichero)), { recursive: true });
    copyFileSync(join(REPO, fichero), join(raiz, fichero));
  }
  for (const capa of capas) {
    const r = ejecutarEn(raiz, "tar", ["-xzf", join(PRUEBAS, `${capa}.tar.gz`)]);
    if (r.codigo !== 0) throw new Error(`No se ha podido extraer ${capa}.tar.gz: ${r.salida}`);
  }
  for (const parche of parches) {
    // Los parches van comprimidos (.patch.gz) por lo mismo que las capas.
    const temporal = join(raiz, ".parche-de-prueba.patch");
    writeFileSync(temporal, gunzipSync(readFileSync(join(PRUEBAS, `${parche}.gz`))));
    const r = ejecutarEn(raiz, "git", ["apply", temporal]);
    rmSync(temporal);
    if (r.codigo !== 0) throw new Error(`No se ha podido aplicar ${parche}: ${r.salida}`);
  }
  const instalacion = ejecutarEn(raiz, "pnpm", ["install", "--frozen-lockfile", "--offline"]);
  if (instalacion.codigo !== 0) ejecutarEn(raiz, "pnpm", ["install", "--frozen-lockfile"]);
  return { raiz, limpiar: () => rmSync(raiz, { recursive: true, force: true }) };
}

/** Líneas del informe común a todos los correctores. */
export function lineasDeFijas(fijas) {
  return fijas.map((f) => `  ${f.ok ? "✓" : "✗"} ${f.t}`);
}

/** Las entradas "### Session" de PROGRESS.md. */
export function sesionesDeProgress(raiz) {
  const ruta = join(raiz, "PROGRESS.md");
  if (!existsSync(ruta)) return [];
  const salida = [];
  let actual = null;
  for (const linea of readFileSync(ruta, "utf8").replace(/\r\n/g, "\n").split("\n")) {
    if (/^###\s+/.test(linea)) {
      actual = { titulo: linea.replace(/^###\s+/, "").trim(), texto: "" };
      salida.push(actual);
    } else if (/^##\s+/.test(linea)) {
      actual = null;
    } else if (actual) {
      actual.texto += `${linea}\n`;
    }
  }
  return salida;
}

/** La última sesión de PROGRESS.md que valida esa feature y dice su veredicto. */
export function sesionDeValidacion(raiz, id) {
  const sesiones = sesionesDeProgress(raiz).filter(
    (s) =>
      s.texto.includes(id) &&
      /feature-validator|\bvalida/i.test(s.texto) &&
      /veredicto\W{0,4}[^\n]{0,20}\b(accept|revise|block)\b/i.test(s.texto),
  );
  return sesiones.at(-1) ?? null;
}
