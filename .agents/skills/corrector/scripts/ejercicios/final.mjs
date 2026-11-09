// Ejercicio final · Dos features con el bucle completo, sin ayuda: ver-saldos y liquidar.
// Fijas: las dos en accepted con evidencia, su spec en docs/specs/, su validación en PROGRESS.md, ./init.sh en
// verde y, en cuentas-claras, los tests del curso. Rúbrica: los escenarios de cada spec se pueden comprobar
// (la del ejercicio 5) y cada validación cita evidencia ejecutada (la del ejercicio 7).
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { comprobarInit, comprobarTestsOcultos, leerJson, lineasDeFijas, PRUEBAS, proyectoDePrueba } from "../proyecto.mjs";
import { corregirEjercicio as corregirSpec } from "./5.mjs";
import { esProyectoDelCurso } from "./6.mjs";
import { comprobarValidada, revisarValidacion } from "./7.mjs";

const DEL_CURSO = ["ver-saldos", "liquidar"];
const TESTS_OCULTOS = join(PRUEBAS, "ejercicio-final", "saldos-liquidar.oculto.ts.gz");

export async function corregirEjercicio({ raiz, fichero, modelo }) {
  const lista = leerJson(join(raiz, "feature_list.json"));
  if (!lista) throw new Error("No hay feature_list.json en la raíz del repo.");
  const pedidas = fichero ? [...new Set(fichero.split(",").map((s) => s.trim()).filter(Boolean))] : null;
  // En cuentas-claras el final son siempre ver-saldos y liquidar, con sus tests del curso, aunque se nombren.
  const curso = esProyectoDelCurso(raiz);
  if (curso && pedidas && DEL_CURSO.some((id) => !pedidas.includes(id))) {
    throw new Error(`En cuentas-claras, el ejercicio final son ${DEL_CURSO.join(" y ")}: corregir.mjs final`);
  }
  if (!curso && !pedidas) throw new Error("Dime qué dos features has hecho: corregir.mjs final <id1>,<id2>");
  const ids = curso ? DEL_CURSO : pedidas;
  if (ids.length < 2) throw new Error("El ejercicio final son dos features: corregir.mjs final <id1>,<id2>");

  const fijas = [];
  const porFeature = [];
  for (const id of ids) {
    const validada = comprobarValidada(raiz, lista, id);
    const spec = join(raiz, "docs", "specs", `${id}.md`);
    const conSpec = existsSync(spec);
    fijas.push(conSpec ? { ok: true, t: `Está la spec docs/specs/${id}.md` } : { ok: false, t: `Falta la spec docs/specs/${id}.md` }, ...validada.fijas);
    porFeature.push({ id, spec: conSpec ? spec : null, ...validada });
  }
  fijas.push(comprobarInit(raiz));
  let ocultos = null;
  if (curso) {
    ocultos = comprobarTestsOcultos(raiz, TESTS_OCULTOS, "ver-saldos y liquidar");
    fijas.push(ocultos);
  }

  const l = [`Corrector · ejercicio final · ${ids.join(" y ")}`, "", "Comprobaciones fijas", ...lineasDeFijas(fijas)];
  let problemas = 0;
  let coste = 0;
  const specs = [];
  const validaciones = [];
  for (const f of porFeature) {
    l.push("", `${f.id} (modelo chat de DevExpert Inference)`);
    if (f.spec) {
      const r = await corregirSpec({ raiz, fichero: f.spec, modelo });
      const ok = r.fijasOk && r.marcados.length === 0;
      specs.push(ok);
      if (ok) l.push("  ✓ Los escenarios de la spec se pueden comprobar");
      else {
        problemas++;
        l.push(`  ⚠ La spec tiene escenarios que no se pueden comprobar${r.marcados.length ? ` (${r.marcados.join(", ")})` : ""}. Pásale el corrector del ejercicio 5 para ver el detalle:`);
        l.push(`      node .agents/skills/corrector/scripts/corregir.mjs 5 docs/specs/${f.id}.md`);
      }
      coste += Number(/revisión: ([\d.]+) \$/.exec(r.texto)?.[1] ?? 0);
    }
    if (f.sesion) {
      const v = await revisarValidacion({ id: f.id, sesion: f.sesion, evidencia: f.evidencia, modelo });
      validaciones.push(v.ok);
      if (!v.ok) problemas++;
      l.push(...v.lineas.filter((x) => !x.startsWith("  ·")));
      coste += v.coste ?? 0;
    }
  }

  const veredicto = fijas.every((f) => f.ok) && problemas === 0 ? "accept" : "revise";
  l.push(
    "",
    veredicto === "accept"
      ? "Veredicto: accept. Has hecho las dos features con el bucle completo. Con esto ya puedes entregar la práctica final en la academia para conseguir el certificado."
      : "Veredicto: revise. Corrige lo marcado y vuelve a pasar el corrector.",
  );
  if (coste) l.push(`(revisión: ${coste.toFixed(4)} $)`);
  return { veredicto, fallan: fijas.filter((f) => !f.ok).length, fallanOcultos: ocultos ? !ocultos.ok : null, specs, validaciones, texto: l.join("\n") };
}

/** Casos de calibración: la solución de referencia con los cambios de cada caso. */
export function prepararCaso({ caso }) {
  const parches = { "saldos-al-reves": ["ejercicio-final/saldos-al-reves.patch"], "spec-ambigua": ["ejercicio-final/spec-ambigua.patch"] }[caso] ?? [];
  const proyecto = proyectoDePrueba({ capas: ["comun/final"], parches });
  if (caso === "liquidar-sin-validar") {
    const ruta = join(proyecto.raiz, "feature_list.json");
    const lista = JSON.parse(readFileSync(ruta, "utf8").replace(/\r\n/g, "\n"));
    lista.find((f) => f.id === "liquidar").status = "passing";
    writeFileSync(ruta, `${JSON.stringify(lista, null, 2)}\n`);
  }
  return proyecto;
}
