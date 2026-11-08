// Ejercicio 2 · Pon límites: permisos para que el agente no pueda tocar ejercicios/.
// Fijas: la configuración del repo es JSON válido y deniega editar esa carpeta (y, en OpenCode, también la
// terminal), la entrega tiene la configuración y la salida, y el fichero del intento sigue igual.
// Rúbrica: que la salida muestre de verdad un bloqueo de esa carpeta y no otro error.
import { copyFileSync, existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative, resolve } from "node:path";
import { bloques, campos, lineasDeFijas, partesDe, SKILL, texto, vacio } from "../entrega.mjs";
import { conBarras, lanzar } from "../plataforma.mjs";

export const ENTREGA = join("ejercicios", "entregas", "02-permisos.md");
const ETIQUETA = "inicio-ejercicio-5";

/** Patrón de permisos de OpenCode o de Claude Code → RegExp. El asterisco vale por cualquier cosa. */
const patron = (p) => new RegExp(`^${p.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*+/g, ".*")}$`);

const normalizarCarpeta = (c) => `${(c ?? "").replace(/[`'"]/g, "").trim().replace(/^\.\//, "").replace(/\/+$/, "")}/`;

/** ¿Alguna regla deny de esta herramienta cubre la ruta o la orden de ejemplo, sin que una allow posterior la anule? */
function deniega(reglas, ejemplo) {
  if (!reglas) return false;
  if (typeof reglas === "string") return false;
  let accion = null;
  for (const [p, a] of Object.entries(reglas)) if (patron(p).test(ejemplo)) accion = a;
  return accion === "deny";
}

function leerJsonCon(ruta) {
  try {
    return { datos: JSON.parse(readFileSync(ruta, "utf8").replace(/\r\n/g, "\n")) };
  } catch (e) {
    return { error: e.message };
  }
}

/** La configuración de permisos del repo: opencode.json o .claude/settings.json. */
function comprobarConfiguracion(raiz, carpeta) {
  const fijas = [];
  const fichero = `${carpeta}briefing.md`;
  const opencode = join(raiz, "opencode.json");
  const claude = join(raiz, ".claude", "settings.json");
  let alguna = false;

  if (existsSync(opencode)) {
    const { datos, error } = leerJsonCon(opencode);
    if (error) return [{ id: "configuracion", ok: false, t: `opencode.json no es JSON válido: ${error}` }];
    const p = datos.permission;
    if (p) {
      alguna = true;
      const edit = typeof p.edit === "string" ? null : p.edit;
      if (p.edit === "deny") fijas.push({ id: "configuracion", ok: false, t: "opencode.json deniega editar en todo el proyecto. La regla tiene que ser solo para la carpeta" });
      else if (deniega(edit, fichero)) fijas.push({ id: "configuracion", ok: true, t: `opencode.json deniega editar ${carpeta}` });
      else fijas.push({ id: "configuracion", ok: false, t: `opencode.json no deniega editar ${carpeta}. En "edit", añade "${carpeta}**": "deny" después de "*": "allow"` });
      const orden = `echo hola >> ${fichero}`;
      if (p.bash === "deny" || deniega(p.bash, orden)) fijas.push({ id: "configuracion", ok: true, t: `opencode.json deniega las órdenes de terminal que nombran ${carpeta}` });
      else fijas.push({ id: "configuracion", ok: false, t: `opencode.json no cierra la terminal: con una orden como "${orden}" el agente podría escribir igual. En "bash", añade "*${carpeta}*": "deny"` });
    }
  }
  if (!alguna && existsSync(claude)) {
    const { datos, error } = leerJsonCon(claude);
    if (error) return [{ id: "configuracion", ok: false, t: `.claude/settings.json no es JSON válido: ${error}` }];
    const deny = datos.permissions?.deny ?? [];
    if (deny.length) {
      alguna = true;
      const regla = deny.find((r) => {
        const m = /^(Edit|Write|MultiEdit)\((.+)\)$/.exec(r);
        return m && patron(m[2].replace(/^\.\//, "")).test(fichero);
      });
      fijas.push(
        regla
          ? { id: "configuracion", ok: true, t: `.claude/settings.json deniega ${regla}` }
          : { id: "configuracion", ok: false, t: `.claude/settings.json no deniega editar ${carpeta}. Añade "Edit(${carpeta}**)" a "permissions.deny"` },
      );
    }
  }
  if (!alguna) fijas.push({ id: "configuracion", ok: false, t: 'No encuentro permisos en el repo: ni un bloque "permission" en opencode.json ni "permissions.deny" en .claude/settings.json' });
  return fijas;
}

/** ¿Sigue igual el fichero del intento? Solo en cuentas-claras, comparando con la etiqueta del ejercicio. */
function comprobarBriefing(raiz, carpeta) {
  if (carpeta !== "ejercicios/") return null;
  const git = (...args) => lanzar("git", args, { cwd: raiz, encoding: "utf8" });
  if (git("rev-parse", "-q", "--verify", `refs/tags/${ETIQUETA}`).status !== 0) return null;
  if (git("cat-file", "-e", `${ETIQUETA}:ejercicios/briefing.md`).status !== 0) return null;
  const r = git("diff", "--quiet", ETIQUETA, "--", "ejercicios/briefing.md");
  return r.status === 0
    ? { id: "briefing", ok: true, t: "ejercicios/briefing.md sigue igual que al empezar" }
    : { id: "briefing", ok: false, t: "ejercicios/briefing.md ha cambiado: el agente ha podido escribir. Deshazlo con git checkout ejercicios/briefing.md, revisa los permisos y repite el intento" };
}

function comprobarEntrega(md, carpeta) {
  const parte = partesDe(md);
  const fijas = [];
  const config = parte("Configuracion");
  const codigo = bloques(config).map((b) => b.codigo).join("\n") || texto(config);
  if (vacio(codigo)) fijas.push({ id: "entrega", ok: false, t: "Falta la configuración en la entrega" });
  else {
    let valida = false;
    for (const intento of [codigo, `{${codigo}}`]) {
      try {
        JSON.parse(intento);
        valida = true;
        break;
      } catch {}
    }
    if (!valida) fijas.push({ id: "entrega", ok: false, t: "La configuración que has pegado no es JSON válido. Copia el bloque entero, con sus llaves" });
    else if (!codigo.includes(carpeta.replace(/\/$/, "")) || !/deny/i.test(codigo)) fijas.push({ id: "entrega", ok: false, t: `La configuración que has pegado no tiene una regla deny para ${carpeta}` });
    else fijas.push({ id: "entrega", ok: true, t: "La entrega tiene la configuración, con la regla deny" });
  }
  const salida = bloques(parte("Salida")).map((b) => b.codigo).join("\n") || texto(parte("Salida"));
  if (vacio(salida) || salida.split("\n").filter((l) => l.trim()).length < 2) fijas.push({ id: "salida", ok: false, t: "Falta la salida del intento: pega todo lo que sale en la terminal, desde la orden hasta la respuesta del agente" });
  else if (!salida.includes(carpeta.replace(/\/$/, ""))) fijas.push({ id: "salida", ok: false, t: `La salida que has pegado no nombra ${carpeta}` });
  else fijas.push({ id: "salida", ok: true, t: "La entrega tiene la salida del intento" });
  return { fijas, configuracion: codigo, salida };
}

async function revisarSalida({ carpeta, configuracion, salida, modelo }) {
  const sistema = readFileSync(join(SKILL, "rubricas", "ejercicio-2.md"), "utf8").replace(/\r\n/g, "\n");
  const entrada = { carpeta_protegida: carpeta, configuracion, salida: salida.slice(0, 8000) };
  return modelo(sistema, JSON.stringify(entrada, null, 2), {
    claves: ["bloqueo", "tipo"],
    valida: (d) => typeof d.bloqueo === "boolean",
  });
}

export async function corregirEjercicio({ raiz, fichero, modelo }) {
  const ruta = fichero ? resolve(fichero) : join(raiz, ENTREGA);
  if (!existsSync(ruta)) throw new Error(`No encuentro ${conBarras(relative(raiz, ruta))}. Rellena la plantilla del ejercicio 2.`);
  const md = readFileSync(ruta, "utf8").replace(/\r\n/g, "\n");
  const carpeta = normalizarCarpeta(campos(md).get("carpeta protegida") || "ejercicios/");

  const fijas = comprobarConfiguracion(raiz, carpeta);
  const entrega = comprobarEntrega(md, carpeta);
  fijas.push(...entrega.fijas);
  const briefing = comprobarBriefing(raiz, carpeta);
  if (briefing) fijas.push(briefing);

  const l = [`Corrector · ejercicio 2 · ${conBarras(relative(raiz, ruta))} · carpeta ${carpeta}`, "", "Comprobaciones fijas", ...lineasDeFijas(fijas)];
  let revision = null;
  let coste = null;
  if (entrega.fijas.find((f) => f.id === "salida")?.ok) {
    const r = await revisarSalida({ carpeta, configuracion: entrega.configuracion, salida: entrega.salida, modelo });
    revision = r.datos;
    coste = r.coste;
    l.push("", "La salida del intento (modelo chat de DevExpert Inference)");
    if (revision.bloqueo) l.push(`  ✓ Muestra un bloqueo de los permisos en ${carpeta}`);
    else {
      l.push(`  ⚠ No muestra un bloqueo de los permisos en ${carpeta}`);
      if (revision.cita) l.push(`      "${revision.cita}"`);
      if (revision.motivo) l.push(`      Por qué: ${revision.motivo}`);
    }
  }
  const fallan = [...new Set(fijas.filter((f) => !f.ok).map((f) => f.id))];
  const veredicto = fallan.length === 0 && revision?.bloqueo === true ? "accept" : "revise";
  l.push(
    "",
    veredicto === "accept"
      ? `Veredicto: accept. El agente no puede tocar ${carpeta} y lo has comprobado.`
      : "Veredicto: revise. Corrige lo marcado y vuelve a pasar el corrector.",
  );
  if (coste != null) l.push(`(revisión: ${coste.toFixed(4)} $)`);
  return { veredicto, fallan, bloqueo: revision ? revision.bloqueo : null, texto: l.join("\n") };
}

/** Casos de calibración: cada caso es una carpeta con config.json (el opencode.json del repo) y entrega.md. */
export function prepararCaso({ carpeta, caso }) {
  const raiz = mkdtempSync(join(tmpdir(), "corrector-2-"));
  const origen = join(carpeta, caso);
  if (existsSync(join(origen, "config.json"))) copyFileSync(join(origen, "config.json"), join(raiz, "opencode.json"));
  return { raiz, fichero: join(origen, "entrega.md"), limpiar: () => rmSync(raiz, { recursive: true, force: true }) };
}
