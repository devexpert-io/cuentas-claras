// Ejercicio 7 · Valida con feature-validator en una sesión nueva.
// Fijas: la feature en accepted con evidencia, una entrada de validación en PROGRESS.md y, en cuentas-claras,
// los tests del curso del ejercicio 6. Rúbrica: que la validación cite evidencia ejecutada y no opiniones.
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { comprobarTestsOcultos, leerJson, lineasDeFijas, proyectoDePrueba, sesionDeValidacion, SKILL } from "../proyecto.mjs";
import { esProyectoDelCurso, TESTS_OCULTOS } from "./6.mjs";

/** Comprobaciones fijas de una feature validada. Las usa también el ejercicio final. */
export function comprobarValidada(raiz, lista, id) {
  const fijas = [];
  const f = lista?.find((x) => x.id === id);
  if (!f) return { fijas: [{ ok: false, t: `No encuentro ${id} en feature_list.json` }], sesion: null, evidencia: [] };
  fijas.push(
    f.status === "accepted"
      ? { ok: true, t: `${id} está en accepted` }
      : { ok: false, t: `${id} está en ${f.status}. Pásale feature-validator en una sesión nueva y, si da accept, confírmalo para que la pase a accepted` },
  );
  const evidencia = f.evidence ?? [];
  fijas.push(evidencia.length ? { ok: true, t: `${id} tiene ${evidencia.length} entradas de evidencia` } : { ok: false, t: `${id} no tiene evidencia en feature_list.json` });
  const sesion = sesionDeValidacion(raiz, id);
  fijas.push(
    sesion
      ? { ok: true, t: `PROGRESS.md tiene la validación de ${id} con su veredicto (${sesion.titulo})` }
      : { ok: false, t: `PROGRESS.md no tiene ninguna sesión que valide ${id} y diga el veredicto (accept, revise o block)` },
  );
  if (sesion && !/\baccept\b/i.test(sesion.texto)) fijas.push({ ok: false, t: `La última validación de ${id} en PROGRESS.md no da accept` });
  return { fijas, sesion, evidencia };
}

/** Revisión con rúbrica de una validación. Devuelve { lineas, ok, coste }. */
export async function revisarValidacion({ id, sesion, evidencia, modelo }) {
  const entrada = {
    feature: id,
    sesion_de_validacion: `${sesion.titulo}\n${sesion.texto}`.trim(),
    evidencia_de_la_validacion: evidencia.filter((e) => /valida/i.test(e)),
  };
  const sistema = readFileSync(join(SKILL, "rubricas", "ejercicio-7.md"), "utf8").replace(/\r\n/g, "\n");
  const { datos, coste } = await modelo(sistema, JSON.stringify(entrada, null, 2), { claves: ["cita_evidencia"] });
  const lineas = [];
  for (const a of datos?.afirmaciones ?? []) lineas.push(`  ${a.tipo === "ejecutada" ? "✓" : "·"} ${a.tipo === "ejecutada" ? "Ejecutado" : "Opinión"}: ${a.texto}`);
  const ok = datos?.cita_evidencia === true;
  lineas.push(ok ? `  ✓ La validación de ${id} se apoya en evidencia ejecutada` : `  ⚠ La validación de ${id} no cita evidencia ejecutada${datos?.motivo ? `: ${datos.motivo}` : ""}`);
  return { lineas, ok, coste };
}

export async function corregirEjercicio({ raiz, fichero, modelo }) {
  const lista = leerJson(join(raiz, "feature_list.json"));
  if (!lista) throw new Error("No hay feature_list.json en la raíz del repo.");
  const id = fichero ?? (lista.some((f) => f.id === "anotar-gasto") ? "anotar-gasto" : null);
  if (!id) throw new Error("Dime qué feature has validado: corregir.mjs 7 <id-de-la-feature>");

  const { fijas, sesion, evidencia } = comprobarValidada(raiz, lista, id);
  let ocultos = null;
  if (id === "anotar-gasto" && esProyectoDelCurso(raiz)) {
    ocultos = comprobarTestsOcultos(raiz, TESTS_OCULTOS, "anotar-gasto (los del ejercicio 6)");
    fijas.push(ocultos);
  }

  const l = [`Corrector · ejercicio 7 · validación de ${id}`, "", "Comprobaciones fijas", ...lineasDeFijas(fijas)];
  let revision = null;
  if (sesion) {
    revision = await revisarValidacion({ id, sesion, evidencia, modelo });
    l.push("", "La evidencia de la validación (modelo chat de DevExpert Inference)", ...revision.lineas);
  }
  const veredicto = fijas.every((f) => f.ok) && revision?.ok ? "accept" : "revise";
  l.push(
    "",
    veredicto === "accept"
      ? "Veredicto: accept. La feature está validada por otra sesión y con evidencia."
      : "Veredicto: revise. Corrige lo marcado y vuelve a pasar el corrector.",
  );
  if (revision?.coste != null) l.push(`(revisión: ${revision.coste.toFixed(4)} $)`);
  return { veredicto, evidencia: revision ? revision.ok : null, fallan: fijas.filter((f) => !f.ok).length, texto: l.join("\n") };
}

/** Casos de calibración: el proyecto de referencia del ejercicio 6 con la validación de cada caso. */
export function prepararCaso({ carpeta, caso }) {
  const proyecto = proyectoDePrueba({ capas: ["comun/anotar-gasto"] });
  const casos = leerJson(join(carpeta, "casos.json"));
  const { estado, evidencia = [], sesion } = casos[caso];
  const rutaLista = join(proyecto.raiz, "feature_list.json");
  const lista = leerJson(rutaLista);
  const f = lista.find((x) => x.id === "anotar-gasto");
  f.status = estado;
  f.evidence.push(...evidencia);
  writeFileSync(rutaLista, `${JSON.stringify(lista, null, 2)}\n`);
  if (sesion) {
    const rutaProgress = join(proyecto.raiz, "PROGRESS.md");
    writeFileSync(rutaProgress, `${readFileSync(rutaProgress, "utf8").replace(/\r\n/g, "\n").trimEnd()}\n\n${readFileSync(join(carpeta, sesion), "utf8").replace(/\r\n/g, "\n").trim()}\n`);
  }
  return proyecto;
}
