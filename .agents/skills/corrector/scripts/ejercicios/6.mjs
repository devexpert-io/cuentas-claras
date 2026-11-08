// Ejercicio 6 · Implementa la feature.
// En cuentas-claras: ./init.sh y los tests del curso para anotar-gasto, sin modelo.
// En un proyecto propio: una rúbrica revisa el diff de la implementación contra su spec.
import { existsSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { escenarios, seccion, secciones } from "../spec.mjs";
import { comprobarInit, comprobarTestsOcultos, ejecutarEn, leerJson, lineasDeFijas, PRUEBAS, proyectoDePrueba, SKILL } from "../proyecto.mjs";
import { conBarras } from "../plataforma.mjs";

export const TESTS_OCULTOS = join(PRUEBAS, "ejercicio-6", "anotar-gasto.oculto.ts");
const MAX_TESTS = 30_000;
const MAX_CODIGO = 15_000;

const esTest = (ruta) => /(^|\/)(tests?|__tests__|specs?)\/|\.(test|spec)\.[cm]?[jt]sx?$/.test(ruta);
const esDoc = (ruta) => /\.(md|json|ya?ml|txt|lock)$/.test(ruta) || /(^|\/)pnpm-lock\.yaml$/.test(ruta);

/**
 * Lo que ve el modelo del diff: la lista de ficheros con sus líneas, los tests enteros y un extracto de lo
 * añadido en el resto del código. Así la revisión cuesta céntimos aunque el diff sea largo.
 */
export function resumirDiff(diff) {
  const trozos = diff.split(/^(?=diff --git )/m).filter((t) => t.startsWith("diff --git "));
  const ficheros = [];
  let tests = "";
  let codigo = "";
  for (const trozo of trozos) {
    const ruta = /^diff --git a\/(\S+) b\/(\S+)/.exec(trozo)?.[2] ?? "?";
    const lineas = trozo.split("\n");
    const anadidas = lineas.filter((l) => l.startsWith("+") && !l.startsWith("+++"));
    const quitadas = lineas.filter((l) => l.startsWith("-") && !l.startsWith("---"));
    const tipo = esTest(ruta) ? "test" : esDoc(ruta) ? "documentación o datos" : "código";
    ficheros.push({ fichero: ruta, tipo, lineas_anadidas: anadidas.length, lineas_quitadas: quitadas.length });
    if (tipo === "test") tests += `${trozo}\n`;
    else if (tipo === "código") codigo += `### ${ruta}\n${anadidas.slice(0, 80).join("\n")}\n${quitadas.length ? `(y ${quitadas.length} líneas quitadas)\n` : ""}`;
  }
  return {
    ficheros,
    tests: tests.length > MAX_TESTS ? `${tests.slice(0, MAX_TESTS)}\n[… recortado]` : tests,
    codigo_anadido: codigo.length > MAX_CODIGO ? `${codigo.slice(0, MAX_CODIGO)}\n[… recortado]` : codigo,
  };
}

/** ¿Es el proyecto del curso, con anotar-gasto en su lista y la CLI en src/cli.ts? */
export function esProyectoDelCurso(raiz) {
  const lista = leerJson(join(raiz, "feature_list.json"));
  return Boolean(lista?.some((f) => f.id === "anotar-gasto") && existsSync(join(raiz, "src", "cli.ts")));
}

export async function corregirEjercicio({ raiz, fichero, modelo, diff }) {
  if (!fichero && esProyectoDelCurso(raiz)) return corregirCurso(raiz);
  if (!fichero) throw new Error("Dime qué spec has implementado: corregir.mjs 6 docs/specs/<feature>.md");
  return corregirPropio({ raiz, ruta: resolve(fichero), modelo, diff });
}

function corregirCurso(raiz) {
  const fijas = [];
  fijas.push(
    existsSync(join(raiz, "docs", "specs", "anotar-gasto.md"))
      ? { ok: true, t: "Está la spec docs/specs/anotar-gasto.md" }
      : { ok: false, t: "Falta docs/specs/anotar-gasto.md. Parte de inicio-ejercicio-6 o escríbela con feature-spec" },
  );
  fijas.push(comprobarInit(raiz));
  const ocultos = comprobarTestsOcultos(raiz, TESTS_OCULTOS, "anotar-gasto");
  fijas.push(ocultos);
  const veredicto = fijas.every((f) => f.ok) ? "accept" : "revise";
  const texto = [
    "Corrector · ejercicio 6 · anotar-gasto",
    "",
    "Comprobaciones fijas",
    ...lineasDeFijas(fijas),
    "",
    veredicto === "accept"
      ? "Veredicto: accept. La feature hace lo que pide la spec. Valídala en una sesión nueva (ejercicio 7)."
      : "Veredicto: revise. Arregla lo marcado y vuelve a pasar el corrector. Si falla un test del curso, busca en la spec el escenario que lo cubre.",
  ].join("\n");
  return { veredicto, fallanOcultos: !ocultos.ok, texto };
}

/** Cambios desde el último commit que tocó la spec, sin la propia spec. */
function diffDesdeLaSpec(raiz, ruta) {
  const spec = conBarras(relative(raiz, ruta));
  const base = ejecutarEn(raiz, "git", ["log", "-1", "--format=%H", "--", spec]).salida.trim();
  if (!/^[0-9a-f]{40}$/.test(base)) throw new Error(`No encuentro ningún commit con ${spec}. Haz commit de la spec antes de implementar.`);
  ejecutarEn(raiz, "git", ["add", "--intent-to-add", "--all"]);
  return ejecutarEn(raiz, "git", ["diff", base, "--", ".", `:(exclude)${spec}`]).salida;
}

async function corregirPropio({ raiz, ruta, modelo, diff }) {
  const md = readFileSync(ruta, "utf8").replace(/\r\n/g, "\n");
  const partes = secciones(md);
  const esc = escenarios(seccion(partes, ["Acceptance Scenarios", "Escenarios de aceptacion", "Escenarios"])?.cuerpo ?? "");
  const cambios = diff ?? diffDesdeLaSpec(raiz, ruta);
  const fijas = [];
  fijas.push(esc.length ? { ok: true, t: `La spec tiene ${esc.length} escenarios` } : { ok: false, t: "La spec no tiene escenarios de aceptación (### dentro de Acceptance Scenarios)" });
  fijas.push(cambios.trim() ? { ok: true, t: `Hay cambios desde la spec (${cambios.split("\n").length} líneas de diff)` } : { ok: false, t: "No hay cambios desde el último commit de la spec" });

  let revision = null;
  let coste = null;
  if (esc.length && cambios.trim()) {
    const entrada = {
      goal: seccion(partes, ["Goal", "Objetivo"])?.cuerpo.trim() ?? "",
      fuera_de_alcance: seccion(partes, ["Non-Goals", "Fuera de alcance", "No objetivos"])?.cuerpo.trim() ?? "",
      ficheros_previstos: seccion(partes, ["Expected File Changes", "Ficheros que cambian", "Cambios esperados"])?.cuerpo.trim() ?? "",
      escenarios: esc,
      ...resumirDiff(cambios),
    };
    const sistema = readFileSync(join(SKILL, "rubricas", "ejercicio-6.md"), "utf8").replace(/\r\n/g, "\n");
    ({ datos: revision, coste } = await modelo(sistema, JSON.stringify(entrada, null, 2), {
      claves: ["escenarios"],
      valida: (d) => Array.isArray(d.escenarios) && esc.every((e) => d.escenarios.some((r) => Number(r?.n) === e.n && ["si", "parcial", "no"].includes(r.probado))),
    }));
    // Sin la lista de escenarios no hay revisión: mejor un error que un veredicto inventado.
    if (!Array.isArray(revision?.escenarios)) throw new Error("El modelo no ha devuelto la revisión de los escenarios. Vuelve a pasar el corrector.");
  }
  return informePropio({ raiz, ruta, fijas, esc, revision, coste });
}

function informePropio({ raiz, ruta, fijas, esc, revision, coste }) {
  const l = [`Corrector · ejercicio 6 · ${conBarras(relative(raiz, ruta))}`, "", "Comprobaciones fijas", ...lineasDeFijas(fijas)];
  let bloquean = 0;
  const sinProbar = [];
  const sugerencias = [];
  if (revision) {
    l.push("", "El diff contra la spec (modelo chat de DevExpert Inference)", "  Escenarios con test:");
    const porN = new Map((revision.escenarios ?? []).map((r) => [Number(r.n), r]));
    for (const e of esc) {
      const r = porN.get(e.n);
      if (r?.probado === "si" || r?.probado === "parcial") {
        l.push(`    ✓ ${e.n}. ${e.titulo}${r.donde ? ` (${r.donde})` : ""}`);
        if (r.probado === "parcial" && r.motivo) sugerencias.push(`Escenario ${e.n}: ${r.motivo}`);
      } else {
        bloquean++;
        sinProbar.push(e.n);
        l.push(`    ⚠ ${e.n}. ${e.titulo}: ${r?.motivo || "ningún test del diff lo comprueba"}`);
      }
    }
    const fuera = revision.fuera_de_alcance ?? [];
    l.push("", fuera.length ? "  Fuera del alcance de la spec:" : "  ✓ No se sale del alcance de la spec");
    for (const f of fuera) {
      bloquean++;
      l.push(`    ⚠ ${f.cambio}${f.motivo ? `. ${f.motivo}` : ""}`);
    }
    const tests = revision.tests ?? [];
    const graves = tests.filter((t) => t.tipo === "bloquea");
    const leves = tests.filter((t) => t.tipo !== "bloquea");
    if (graves.length) l.push("", "  Tests que no comprueban lo que dicen:");
    for (const t of graves) {
      bloquean++;
      l.push(`    ⚠ ${t.test}: ${t.motivo}`);
    }
    sugerencias.push(...leves.map((t) => `${t.test}: ${t.motivo}`));
    if (sugerencias.length) l.push("", "Sugerencias (no bloquean)", ...sugerencias.map((t) => `  · ${t}`));
  }
  const veredicto = fijas.every((f) => f.ok) && revision && bloquean === 0 ? "accept" : "revise";
  l.push(
    "",
    veredicto === "accept"
      ? "Veredicto: accept. El diff se queda en la spec y sus escenarios tienen test. Valídalo en una sesión nueva (ejercicio 7)."
      : "Veredicto: revise. Corrige lo marcado y vuelve a pasar el corrector.",
  );
  if (coste != null) l.push(`(revisión: ${coste.toFixed(4)} $)`);
  return { veredicto, sinProbar, fuera: (revision?.fuera_de_alcance ?? []).length > 0, texto: l.join("\n") };
}

/** Casos de calibración (pruebas/ejercicio-6/esperado.json). */
export function prepararCaso({ carpeta, caso }) {
  if (caso.startsWith("propio-")) {
    const propio = join(carpeta, "propio");
    return { raiz: propio, fichero: join(propio, "spec.md"), diff: readFileSync(join(propio, `${caso.slice(7)}.diff`), "utf8") };
  }
  const parches = caso === "referencia" ? [] : [`ejercicio-6/${caso}.patch`];
  return proyectoDePrueba({ capas: ["comun/anotar-gasto"], parches });
}
