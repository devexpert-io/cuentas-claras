// Ejercicio 3 · Conecta un MCP de documentación y úsalo para una duda sobre una librería del proyecto.
// Fijas: la configuración declara un MCP y la entrega tiene sus cuatro partes, con una URL en la fuente.
// Rúbrica: que la duda sea de una librería del proyecto y que la fuente sea documentación de esa librería.
import { copyFileSync, existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join, relative, resolve } from "node:path";
import { bloques, lineasDeFijas, partesDe, SKILL, texto, urls, vacio } from "../entrega.mjs";
import { conBarras } from "../plataforma.mjs";

export const ENTREGA = join("ejercicios", "entregas", "03-mcp.md");

const leer = (ruta) => {
  try {
    return { datos: JSON.parse(readFileSync(ruta, "utf8").replace(/\r\n/g, "\n")) };
  } catch (e) {
    return { error: e.message };
  }
};

const servidores = (bloque) =>
  Object.entries(bloque ?? {})
    .filter(([, s]) => s && typeof s === "object" && s.enabled !== false && s.disabled !== true && (s.url || s.command))
    .map(([nombre]) => nombre);

/** El bloque "mcp" de opencode.json: OpenCode 2 los pone en "servers"; OpenCode 1, directamente en "mcp". */
const servidoresDeOpencode = (mcp) => {
  const { servers, timeout, ...antiguos } = mcp ?? {};
  return [...new Set([...servidores(servers), ...servidores(antiguos)])];
};

/** Los MCP declarados: opencode.json, .mcp.json (Claude Code) o config.toml de Codex. */
function comprobarConfiguracion(raiz, { codexGlobal = true } = {}) {
  const opencode = join(raiz, "opencode.json");
  if (existsSync(opencode)) {
    const { datos, error } = leer(opencode);
    if (error) return { id: "configuracion", ok: false, t: `opencode.json no es JSON válido: ${error}` };
    const s = servidoresDeOpencode(datos.mcp);
    if (s.length) return { id: "configuracion", ok: true, t: `opencode.json declara el MCP ${s.join(", ")}` };
  }
  const claude = join(raiz, ".mcp.json");
  if (existsSync(claude)) {
    const { datos, error } = leer(claude);
    if (error) return { id: "configuracion", ok: false, t: `.mcp.json no es JSON válido: ${error}` };
    const s = servidores(datos.mcpServers);
    if (s.length) return { id: "configuracion", ok: true, t: `.mcp.json declara el MCP ${s.join(", ")}` };
  }
  const tomls = [join(raiz, ".codex", "config.toml"), ...(codexGlobal ? [join(homedir(), ".codex", "config.toml")] : [])];
  for (const t of tomls) {
    if (!existsSync(t)) continue;
    const s = [...readFileSync(t, "utf8").replace(/\r\n/g, "\n").matchAll(/^\s*\[mcp_servers\.([^\]\s]+)\]/gm)].map((m) => m[1]);
    if (s.length) return { id: "configuracion", ok: true, t: `${t.startsWith(raiz) ? conBarras(relative(raiz, t)) : t} declara el MCP ${s.join(", ")}` };
  }
  return { id: "configuracion", ok: false, t: 'No encuentro ningún MCP declarado: ni un bloque "mcp" en opencode.json, ni .mcp.json, ni "[mcp_servers.…]" en la configuración de Codex' };
}

function comprobarEntrega(md) {
  const parte = partesDe(md);
  const config = bloques(parte("Configuracion")).map((b) => b.codigo).join("\n") || texto(parte("Configuracion"));
  const pregunta = texto(parte("Pregunta"));
  const respuesta = texto(parte("Respuesta"));
  const fuente = texto(parte("Fuente"));
  const faltan = [];
  if (vacio(config)) faltan.push("la configuración");
  if (vacio(pregunta)) faltan.push("la pregunta");
  if (vacio(respuesta)) faltan.push("la respuesta");
  if (vacio(fuente)) faltan.push("la fuente");
  const fijas = [faltan.length ? { id: "entrega", ok: false, t: `Falta en la entrega: ${faltan.join(", ")}` } : { id: "entrega", ok: true, t: "La entrega tiene la configuración, la pregunta, la respuesta y la fuente" }];
  if (!vacio(config) && !/mcp/i.test(config)) fijas.push({ id: "entrega", ok: false, t: "La configuración que has pegado no declara ningún MCP" });
  const direcciones = urls(fuente);
  if (!vacio(fuente)) {
    fijas.push(direcciones.length ? { id: "url", ok: true, t: `La fuente tiene una URL (${direcciones[0]})` } : { id: "url", ok: false, t: "La fuente no tiene ninguna URL. Pega la dirección de la página que cita la respuesta" });
  }
  return { fijas, pregunta, respuesta, fuente, direcciones };
}

function dependencias(raiz) {
  const ruta = join(raiz, "package.json");
  if (!existsSync(ruta)) return null;
  const { datos } = leer(ruta);
  if (!datos) return null;
  const versiones = { ...datos.dependencies, ...datos.devDependencies };
  if (datos.engines?.node) versiones.node = datos.engines.node;
  return versiones;
}

async function revisarDuda({ raiz, pregunta, respuesta, fuente, modelo }) {
  const sistema = readFileSync(join(SKILL, "rubricas", "ejercicio-3.md"), "utf8").replace(/\r\n/g, "\n");
  const entrada = {
    dependencias_del_proyecto: dependencias(raiz) ?? "no hay package.json: deduce las librerías del proyecto por la pregunta y dilo en el motivo",
    pregunta,
    respuesta: respuesta.slice(0, 6000),
    fuente,
  };
  return modelo(sistema, JSON.stringify(entrada, null, 2), {
    claves: ["del_proyecto", "fuente_de_la_libreria"],
    valida: (d) => typeof d.del_proyecto === "boolean" && typeof d.fuente_de_la_libreria === "boolean",
  });
}

export async function corregirEjercicio({ raiz, fichero, modelo, codexGlobal }) {
  const ruta = fichero ? resolve(fichero) : join(raiz, ENTREGA);
  if (!existsSync(ruta)) throw new Error(`No encuentro ${conBarras(relative(raiz, ruta))}. Rellena la plantilla del ejercicio 3.`);
  const md = readFileSync(ruta, "utf8").replace(/\r\n/g, "\n");
  const fijas = [comprobarConfiguracion(raiz, { codexGlobal })];
  const entrega = comprobarEntrega(md);
  fijas.push(...entrega.fijas);

  const l = [`Corrector · ejercicio 3 · ${conBarras(relative(raiz, ruta))}`, "", "Comprobaciones fijas", ...lineasDeFijas(fijas)];
  let revision = null;
  let coste = null;
  if (entrega.fijas.every((f) => f.ok)) {
    const r = await revisarDuda({ raiz, ...entrega, modelo });
    revision = r.datos;
    coste = r.coste;
    const lib = revision.libreria ? ` (${revision.libreria})` : "";
    l.push("", "La duda y su fuente (modelo chat de DevExpert Inference)");
    l.push(revision.del_proyecto ? `  ✓ La duda es de una librería del proyecto${lib}` : `  ⚠ La duda no es de una librería del proyecto${lib}`);
    l.push(revision.fuente_de_la_libreria ? "  ✓ La fuente es documentación de esa librería" : "  ⚠ La fuente no es documentación de esa librería");
    if (!(revision.del_proyecto && revision.fuente_de_la_libreria) && revision.motivo) l.push(`      Por qué: ${revision.motivo}`);
  } else {
    l.push("", "La duda y su fuente se revisan cuando las comprobaciones fijas estén bien.");
  }
  const fallan = [...new Set(fijas.filter((f) => !f.ok).map((f) => f.id))];
  const ok = revision ? revision.del_proyecto && revision.fuente_de_la_libreria : null;
  const veredicto = fallan.length === 0 && ok ? "accept" : "revise";
  l.push(
    "",
    veredicto === "accept"
      ? "Veredicto: accept. Has resuelto la duda con la documentación, y sabes de dónde sale."
      : "Veredicto: revise. Corrige lo marcado y vuelve a pasar el corrector.",
  );
  if (coste != null) l.push(`(revisión: ${coste.toFixed(4)} $)`);
  return { veredicto, fallan, duda: ok, texto: l.join("\n") };
}

/** Casos de calibración: una carpeta con config.json (el opencode.json del repo) y entrega.md, con el package.json del curso. */
export function prepararCaso({ carpeta, caso }) {
  const raiz = mkdtempSync(join(tmpdir(), "corrector-3-"));
  const origen = join(carpeta, caso);
  if (existsSync(join(origen, "config.json"))) copyFileSync(join(origen, "config.json"), join(raiz, "opencode.json"));
  copyFileSync(join(carpeta, "package.json"), join(raiz, "package.json"));
  return { raiz, fichero: join(origen, "entrega.md"), codexGlobal: false, limpiar: () => rmSync(raiz, { recursive: true, force: true }) };
}
