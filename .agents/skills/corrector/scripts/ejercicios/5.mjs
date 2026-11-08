// Ejercicio 5 · La spec de tu primera feature, escrita con feature-spec.
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { escenarios, idDeFeature, seccion, secciones, tieneComando, tieneGiven, tieneThen, tieneWhen, vinetas } from "../spec.mjs";
import { conBarras } from "../plataforma.mjs";

const SKILL = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");

const SECCIONES = [
  ["Source Feature", "Feature de origen", "Feature"],
  ["Goal", "Objetivo"],
  ["Non-Goals", "Fuera de alcance", "No objetivos"],
  ["Acceptance Scenarios", "Escenarios de aceptacion", "Escenarios"],
  ["Expected File Changes", "Ficheros que cambian", "Cambios esperados"],
  ["Implementation Tasks", "Tareas"],
  ["Verification Plan", "Plan de verificacion", "Verificacion"],
];

const leerJson = (ruta) => (existsSync(ruta) ? JSON.parse(readFileSync(ruta, "utf8").replace(/\r\n/g, "\n")) : null);

/** La spec de la primera feature lista según sus dependencias y sin aceptar, como hace feature-spec. */
function specPorDefecto(raiz, lista) {
  if (!lista) throw new Error("No hay feature_list.json. Dime qué spec corrijo: corregir.mjs 5 docs/specs/<feature>.md");
  const aceptada = new Set(lista.filter((f) => f.status === "accepted").map((f) => f.id));
  const f = lista.find((x) => x.status !== "accepted" && (x.depends_on ?? []).every((d) => aceptada.has(d)));
  if (!f) throw new Error("Todas las features están aceptadas. Dime qué spec corrijo.");
  const ruta = join(raiz, "docs", "specs", `${f.id}.md`);
  if (!existsSync(ruta)) throw new Error(`No encuentro docs/specs/${f.id}.md. Escríbela antes con la skill feature-spec.`);
  return ruta;
}

function comprobacionesFijas(md, lista) {
  const partes = secciones(md);
  const fijas = [];
  const faltan = SECCIONES.filter((nombres) => !seccion(partes, nombres)).map((n) => n[0]);
  fijas.push(faltan.length ? { ok: false, t: `Faltan secciones de la plantilla: ${faltan.join(", ")}` } : { ok: true, t: "Tiene todas las secciones de la plantilla" });

  const origen = seccion(partes, SECCIONES[0]);
  const id = origen ? idDeFeature(origen.cuerpo) : null;
  if (lista) {
    const existe = id && lista.some((f) => f.id === id);
    fijas.push(existe ? { ok: true, t: `Corresponde a la feature ${id} de feature_list.json` } : { ok: false, t: `El id de "Source Feature" (${id ?? "sin id"}) no está en feature_list.json` });
  }

  const esc = escenarios(seccion(partes, SECCIONES[3])?.cuerpo ?? "");
  const incompletos = esc.filter((e) => !(tieneGiven(e.texto) && tieneWhen(e.texto) && tieneThen(e.texto)));
  if (esc.length < 2) fijas.push({ ok: false, t: `Hay ${esc.length} escenario(s). Hacen falta al menos dos: el normal y uno de error` });
  else if (incompletos.length) fijas.push({ ok: false, t: `Escenarios sin Given, When y Then completos: ${incompletos.map((e) => e.n).join(", ")}` });
  else fijas.push({ ok: true, t: `${esc.length} escenarios con Given, When y Then` });

  const fuera = vinetas(seccion(partes, SECCIONES[2])?.cuerpo ?? "");
  fijas.push(fuera ? { ok: true, t: `${fuera} cosas fuera de alcance` } : { ok: false, t: "No dice qué se queda fuera de alcance" });

  const verif = seccion(partes, SECCIONES[6])?.cuerpo ?? "";
  fijas.push(tieneComando(verif) ? { ok: true, t: "El plan de verificación incluye comandos" } : { ok: false, t: "El plan de verificación no dice con qué comando se comprueba" });

  const lineas = md.split("\n").length;
  if (lineas > 300) fijas.push({ ok: false, t: `Tiene ${lineas} líneas. Si pasa de 300, seguramente la feature es demasiado grande` });

  return { fijas, id, esc, partes };
}

async function revisarCriterios({ raiz, lista, id, esc, partes, modelo }) {
  const feature = lista?.find((f) => f.id === id);
  const dominio = join(raiz, "docs", "domain-model.md");
  const entrada = {
    feature: feature ? { id: feature.id, title: feature.title, user_visible_behavior: feature.user_visible_behavior } : null,
    escenarios: esc,
    fuera_de_alcance: seccion(partes, SECCIONES[2])?.cuerpo.trim() ?? "",
    verificacion: seccion(partes, SECCIONES[6])?.cuerpo.trim() ?? "",
    reglas_del_dominio: existsSync(dominio) ? readFileSync(dominio, "utf8").replace(/\r\n/g, "\n").slice(0, 6000) : "",
  };
  const sistema = readFileSync(join(SKILL, "rubricas", "ejercicio-5.md"), "utf8").replace(/\r\n/g, "\n");
  return modelo(sistema, JSON.stringify(entrada, null, 2));
}

function informe({ ruta, raiz, fijas, esc, revision, coste }) {
  const l = [`Corrector · ejercicio 5 · ${conBarras(relative(raiz, ruta))}`, "", "Comprobaciones fijas"];
  for (const f of fijas) l.push(`  ${f.ok ? "✓" : "✗"} ${f.t}`);
  l.push("", "Revisión de criterios (modelo chat de DevExpert Inference)");
  const porN = new Map((revision?.escenarios ?? []).map((r) => [Number(r.n), r]));
  let marcados = 0;
  const escenariosMarcados = [];
  for (const e of esc) {
    const r = porN.get(e.n);
    if (!r) {
      l.push(`  ? ${e.n}. ${e.titulo}: el modelo no lo ha revisado`);
      marcados++;
    } else if (r.veredicto === "comprobable") {
      l.push(`  ✓ ${e.n}. ${e.titulo}`);
    } else {
      marcados++;
      escenariosMarcados.push(e.n);
      l.push(`  ⚠ ${e.n}. ${e.titulo} · ${r.veredicto === "ambiguo" ? "ambiguo" : "no se puede comprobar"}`);
      if (r.cita) l.push(`      "${r.cita}"`);
      if (r.motivo) l.push(`      Por qué: ${r.motivo}`);
      if (r.reescritura) {
        const pasos = r.reescritura.replace(/\s*\n\s*/g, " ").split(/\s+(?=(?:When|Then|And|Cuando|Entonces)\s)/);
        l.push(`      Prueba con:`, ...pasos.map((p) => `        ${p}`));
      }
    }
  }
  const v = revision?.verificacion;
  if (v && v.veredicto !== "comprobable") {
    marcados++;
    l.push(`  ⚠ Plan de verificación · ${v.veredicto === "ambiguo" ? "ambiguo" : "no se puede comprobar"}${v.motivo ? `: ${v.motivo}` : ""}`);
  }
  const veredicto = fijas.every((f) => f.ok) && marcados === 0 ? "accept" : "revise";
  l.push(
    "",
    veredicto === "accept"
      ? "Veredicto: accept. La spec está lista para dársela a una sesión nueva."
      : "Veredicto: revise. Corrige lo marcado y vuelve a pasar el corrector.",
  );
  if (coste != null) l.push(`(revisión: ${coste.toFixed(4)} $)`);
  return { veredicto, marcados: escenariosMarcados, texto: l.join("\n") };
}

export async function corregirEjercicio({ raiz, fichero, modelo }) {
  const lista = leerJson(join(raiz, "feature_list.json"));
  const ruta = fichero ? resolve(fichero) : specPorDefecto(raiz, lista);
  const md = readFileSync(ruta, "utf8").replace(/\r\n/g, "\n");
  const { fijas, id, esc, partes } = comprobacionesFijas(md, lista);
  const { datos, coste } = esc.length ? await revisarCriterios({ raiz, lista, id, esc, partes, modelo }) : { datos: null, coste: null };
  return { ruta, ...informe({ ruta, raiz, fijas, esc, revision: datos, coste }) };
}
