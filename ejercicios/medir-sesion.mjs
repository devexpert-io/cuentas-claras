#!/usr/bin/env node
// Ejercicio 1 · Cuenta los tokens de tus últimas sesiones de OpenCode en este proyecto.
//
//   node ejercicios/medir-sesion.mjs            las dos últimas sesiones de esta carpeta
//   node ejercicios/medir-sesion.mjs <n>        las n últimas
//   node ejercicios/medir-sesion.mjs ses_...    una sesión concreta
//
// Lee las sesiones con `opencode session list` y `opencode session export` (OpenCode 2), y suma los tokens de cada
// petición tuya:
// cuántas llamadas hizo el agente, el contexto con el que empezó, la entrada nueva, la cacheada y la salida.
// El coste lo calculas tú.
import { execFileSync } from "node:child_process";
import { closeSync, mkdtempSync, openSync, readFileSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const n = (x) => String(x).replace(/\B(?=(\d{3})+(?!\d))/g, ".");

// La salida va a un fichero y no a una tubería, para que las sesiones largas no lleguen cortadas.
function opencode(...args) {
  const carpeta = mkdtempSync(join(tmpdir(), "medir-sesion-"));
  const fichero = join(carpeta, "salida.json");
  const fd = openSync(fichero, "w");
  try {
    execFileSync("opencode", args, { stdio: ["ignore", fd, "ignore"] });
    return readFileSync(fichero, "utf8");
  } catch (e) {
    if (e.code === "ENOENT") throw new Error("No encuentro opencode. Instálalo o ábrelo desde esta terminal.");
    throw new Error(`opencode ${args.slice(0, 2).join(" ")} ha fallado. Comprueba con opencode --version que tienes OpenCode 2.`);
  } finally {
    closeSync(fd);
    rmSync(carpeta, { recursive: true, force: true });
  }
}

function sesiones(argumento) {
  if (argumento?.startsWith("ses_")) return [argumento];
  const cuantas = Number(argumento ?? 2);
  const aqui = realpathSync(process.cwd());
  const lista = JSON.parse(opencode("session", "list", "--format", "json", "-n", "50"));
  return lista
    .filter((s) => s.directory && realpathSync.native(s.directory) === aqui)
    .slice(0, cuantas)
    .reverse()
    .map((s) => s.id);
}

/** Agrupa las llamadas al modelo por la petición del usuario que las provocó. */
function peticiones(sesion) {
  const salida = [];
  let actual = null;
  for (const m of sesion.messages ?? []) {
    if (m.type === "user") {
      const texto = (m.text ?? "").trim().replace(/^"(.*)"$/s, "$1");
      actual = { texto, llamadas: 0, entrada: 0, cacheada: 0, salida: 0, primera: 0, ultima: 0 };
      salida.push(actual);
    } else if (m.type === "assistant" && actual && m.tokens) {
      const t = m.tokens;
      actual.llamadas++;
      actual.entrada += t.input ?? 0;
      actual.cacheada += t.cache?.read ?? 0;
      actual.salida += (t.output ?? 0) + (t.reasoning ?? 0);
      const contexto = (t.input ?? 0) + (t.cache?.read ?? 0) + (t.cache?.write ?? 0);
      if (actual.llamadas === 1) actual.primera = contexto;
      actual.ultima = contexto;
    }
  }
  return salida;
}

const ids = sesiones(process.argv[2]);
if (!ids.length) {
  console.error("No hay sesiones de OpenCode en esta carpeta. Ejecuta antes las dos sesiones del ejercicio desde la raíz del repo.");
  process.exit(1);
}
for (const id of ids) {
  const sesion = JSON.parse(opencode("session", "export", id));
  const fecha = new Date(sesion.info?.time?.created ?? Date.now()).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" });
  console.log(`Sesión ${id} · ${fecha} · ${sesion.info?.title ?? ""}`);
  peticiones(sesion).forEach((p, i) => {
    const corta = p.texto.length > 70 ? `${p.texto.slice(0, 70)}…` : p.texto;
    console.log(`  Petición ${i + 1}: "${corta}"`);
    console.log(`    Llamadas al modelo: ${p.llamadas}`);
    console.log(`    Contexto de la primera llamada: ${n(p.primera)} tokens`);
    console.log(`    Entrada nueva: ${n(p.entrada)} tokens`);
    console.log(`    Entrada cacheada: ${n(p.cacheada)} tokens`);
    console.log(`    Salida: ${n(p.salida)} tokens`);
    console.log(`    Contexto de la última llamada: ${n(p.ultima)} tokens`);
  });
  console.log("");
}
