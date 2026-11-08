// Ejercicio 4 · Prepara el repo con build-brief y harness-starter.
// Fijas: los siete ficheros, init.sh ejecutable, AGENTS.md con menos de 100 líneas, feature_list.json con el
// esquema de harness-starter, depends_on que existen y sin ciclos, y ./init.sh en verde.
// Rúbrica: que cada feature quepa en una sesión y que las reglas del briefing estén en el modelo de dominio.
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { lineasDeFijas, SKILL } from "../entrega.mjs";
import { WINDOWS, bash, lanzar } from "../plataforma.mjs";

const FICHEROS = ["CONTEXT.md", "docs/build-brief.md", "docs/domain-model.md", "AGENTS.md", "PROGRESS.md", "feature_list.json", "init.sh"];
const ESTADOS = ["not_started", "in_progress", "blocked", "passing", "accepted"];
const MAX_LINEAS_AGENTS = 100;

const leer = (raiz, f) => readFileSync(join(raiz, f), "utf8").replace(/\r\n/g, "\n");

function comprobarFicheros(raiz) {
  const faltan = FICHEROS.filter((f) => !existsSync(join(raiz, f)));
  const fijas = [faltan.length ? { id: "ficheros", ok: false, t: `Faltan: ${faltan.join(", ")}` } : { id: "ficheros", ok: true, t: `Están los ${FICHEROS.length} ficheros: ${FICHEROS.join(", ")}` }];
  if (!WINDOWS && existsSync(join(raiz, "init.sh")) && !(statSync(join(raiz, "init.sh")).mode & 0o111)) {
    fijas.push({ id: "ficheros", ok: false, t: "init.sh no es ejecutable. Arréglalo con chmod +x init.sh" });
  }
  if (existsSync(join(raiz, "AGENTS.md"))) {
    const n = leer(raiz, "AGENTS.md").trimEnd().split("\n").length;
    fijas.push(n < MAX_LINEAS_AGENTS ? { id: "agents", ok: true, t: `AGENTS.md tiene ${n} líneas` } : { id: "agents", ok: false, t: `AGENTS.md tiene ${n} líneas. Tiene que quedarse por debajo de ${MAX_LINEAS_AGENTS}: es una página de entrada, el detalle va en los documentos que enlaza` });
  }
  return fijas;
}

/** El esquema de harness-starter (references/artifact-templates.md), las dependencias y los ciclos. */
export function comprobarLista(lista) {
  if (!Array.isArray(lista) || lista.length === 0) return { ok: false, t: "feature_list.json tiene que ser una lista de features" };
  const problemas = [];
  const ids = new Set();
  lista.forEach((f, i) => {
    const quien = f?.id ? `"${f.id}"` : `la ${i + 1}ª`;
    for (const campo of ["id", "area", "title", "user_visible_behavior", "status"]) {
      if (typeof f?.[campo] !== "string" || !f[campo].trim()) problemas.push(`${quien} no tiene "${campo}"`);
    }
    for (const campo of ["depends_on", "verification", "evidence"]) if (!Array.isArray(f?.[campo])) problemas.push(`${quien}: "${campo}" tiene que ser una lista`);
    if (Array.isArray(f?.verification) && f.verification.length === 0) problemas.push(`${quien} no dice cómo se verifica`);
    if (f?.status && !ESTADOS.includes(f.status)) problemas.push(`${quien} tiene un estado que no existe (${f.status})`);
    if (f?.id && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(f.id)) problemas.push(`${quien}: el id tiene que ir en kebab-case`);
    if (f?.id && ids.has(f.id)) problemas.push(`${quien} está repetida`);
    if ("priority" in (f ?? {})) problemas.push(`${quien} tiene "priority": el orden lo dan la lista y depends_on`);
    if (f?.id) ids.add(f.id);
  });
  for (const f of lista) for (const d of Array.isArray(f?.depends_on) ? f.depends_on : []) if (!ids.has(d)) problemas.push(`"${f.id}" depende de "${d}", que no está en la lista`);
  if (lista.filter((f) => f?.status === "in_progress").length > 1) problemas.push("hay más de una feature en in_progress");

  const deps = new Map(lista.map((f) => [f?.id, Array.isArray(f?.depends_on) ? f.depends_on : []]));
  const estado = new Map();
  let ciclo = null;
  const visitar = (id, camino) => {
    if (ciclo || !deps.has(id)) return;
    if (estado.get(id) === "visitando") {
      ciclo = [...camino.slice(camino.indexOf(id)), id];
      return;
    }
    if (estado.get(id) === "hecho") return;
    estado.set(id, "visitando");
    for (const d of deps.get(id)) visitar(d, [...camino, id]);
    estado.set(id, "hecho");
  };
  for (const id of deps.keys()) visitar(id, []);
  if (ciclo) problemas.push(`hay un ciclo en depends_on: ${ciclo.join(" → ")}`);

  return problemas.length
    ? { ok: false, t: `feature_list.json no cumple el esquema de harness-starter:\n${problemas.map((p) => `- ${p}`).join("\n")}` }
    : { ok: true, t: `feature_list.json cumple el esquema de harness-starter: ${lista.length} features, dependencias que existen y sin ciclos` };
}

function comprobarInit(raiz) {
  const r = lanzar(bash(), ["./init.sh"], { cwd: raiz, encoding: "utf8", timeout: 300_000, env: { ...process.env, CI: "1", FORCE_COLOR: "0", NO_COLOR: "1" } });
  if (r.status === 0) return { id: "init", ok: true, t: "./init.sh termina con código 0" };
  const cola = `${r.stdout ?? ""}${r.stderr ?? ""}`.trim().split("\n").slice(-8).join("\n");
  return { id: "init", ok: false, t: `./init.sh falla (código ${r.status ?? "sin código"}):\n${cola}` };
}

/** Las reglas del briefing: ejercicios/briefing.md en cuentas-claras y, si no, docs/build-brief.md. */
function briefingDe(raiz) {
  for (const f of ["ejercicios/briefing.md", "docs/build-brief.md"]) if (existsSync(join(raiz, f))) return { fichero: f, texto: leer(raiz, f).slice(0, 8000) };
  return null;
}

async function revisarCriterio({ raiz, lista, modelo }) {
  const sistema = readFileSync(join(SKILL, "rubricas", "ejercicio-4.md"), "utf8").replace(/\r\n/g, "\n");
  const briefing = briefingDe(raiz);
  const entrada = {
    features: lista.map((f) => ({ id: f.id, title: f.title, user_visible_behavior: f.user_visible_behavior, depends_on: f.depends_on, verification: f.verification })),
    briefing: briefing ? `${briefing.fichero}\n\n${briefing.texto}` : "",
    modelo_de_dominio: leer(raiz, "docs/domain-model.md").slice(0, 12000),
  };
  return modelo(sistema, JSON.stringify(entrada, null, 2), {
    claves: ["features", "reglas"],
    valida: (d) => Array.isArray(d.features) && Array.isArray(d.reglas) && d.features.length === lista.length,
  });
}

export async function corregirEjercicio({ raiz, modelo }) {
  const fijas = comprobarFicheros(raiz);
  let lista = null;
  if (existsSync(join(raiz, "feature_list.json"))) {
    try {
      lista = JSON.parse(leer(raiz, "feature_list.json"));
      fijas.push({ id: "lista", ...comprobarLista(lista) });
    } catch (e) {
      fijas.push({ id: "lista", ok: false, t: `feature_list.json no es JSON válido: ${e.message}` });
    }
  }
  if (existsSync(join(raiz, "init.sh"))) fijas.push(comprobarInit(raiz));

  const l = ["Corrector · ejercicio 4 · el repo preparado con build-brief y harness-starter", "", "Comprobaciones fijas", ...lineasDeFijas(fijas)];
  let revision = null;
  let coste = null;
  const listaOk = fijas.find((f) => f.id === "lista")?.ok;
  if (listaOk && existsSync(join(raiz, "docs/domain-model.md"))) {
    const r = await revisarCriterio({ raiz, lista, modelo });
    revision = r.datos;
    coste = r.coste;
    l.push("", "Tamaño de las features (modelo chat de DevExpert Inference)");
    for (const f of revision.features) {
      if (f.veredicto === "epica") l.push(`  ⚠ ${f.id}: no cabe en una sesión${f.motivo ? `. ${f.motivo}` : ""}`);
      else if (f.veredicto === "demasiado_pequena") l.push(`  · ${f.id}: quizá es demasiado pequeña para ser una feature (no bloquea)${f.motivo ? `. ${f.motivo}` : ""}`);
      else l.push(`  ✓ ${f.id}`);
    }
    l.push("", "Reglas del briefing en el modelo de dominio");
    for (const r of revision.reglas) l.push(`  ${r.en_modelo ? "✓" : "⚠"} ${r.regla}${!r.en_modelo && r.motivo ? `\n      Por qué: ${r.motivo}` : ""}`);
  }
  const epicas = (revision?.features ?? []).filter((f) => f.veredicto === "epica").map((f) => f.id);
  const reglas = revision ? revision.reglas.every((r) => r.en_modelo) : null;
  const fallan = [...new Set(fijas.filter((f) => !f.ok).map((f) => f.id))];
  const veredicto = fallan.length === 0 && revision && epicas.length === 0 && reglas ? "accept" : "revise";
  l.push(
    "",
    veredicto === "accept"
      ? "Veredicto: accept. El repo está listo para que una sesión nueva sepa qué hay y qué toca."
      : `Veredicto: revise. Corrige lo marcado y vuelve a pasar el corrector.${epicas.length ? " Si una feature no cabe en una sesión, divídela en varias con su propio id y ajusta los depends_on." : ""}`,
  );
  if (coste != null) l.push(`(revisión: ${coste.toFixed(4)} $)`);
  return { veredicto, fallan, epicas: revision ? epicas : null, reglas, texto: l.join("\n") };
}

/**
 * Casos de calibración. pruebas/ejercicio-4/proyectos.tar.gz lleva, comprimidos para que no los encuentren las
 * búsquedas del agente, el repo en inicio-ejercicio-5 (base/) y los ficheros que cambian en cada caso.
 */
export function prepararCaso({ carpeta, caso }) {
  const tmp = mkdtempSync(join(tmpdir(), "corrector-4-"));
  const r = lanzar("tar", ["-xzf", join(carpeta, "proyectos.tar.gz"), "-C", tmp]);
  if (r.status !== 0) throw new Error(`No he podido descomprimir proyectos.tar.gz: ${r.stderr}`);
  const raiz = join(tmp, "base");
  if (caso !== "base") cpSync(join(tmp, caso), raiz, { recursive: true });
  const instalar = (...extra) => lanzar("pnpm", ["install", "--frozen-lockfile", ...extra], { cwd: raiz, encoding: "utf8" }).status;
  if (instalar("--offline") !== 0) instalar();
  return { raiz, limpiar: () => rmSync(tmp, { recursive: true, force: true }) };
}
