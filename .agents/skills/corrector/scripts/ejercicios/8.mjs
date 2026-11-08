// Ejercicio 8 · Crea tu propia skill.
// Fijas: .agents/skills/<nombre>/SKILL.md con nombre y descripción en el frontmatter, y el nombre igual que la carpeta.
// Rúbrica: que la descripción diga qué hace y cuándo usarla y que las instrucciones sean concretas. Después, con
// solo los nombres y las descripciones de todas las skills del repo, otro modelo decide cuál cargaría para
// tres peticiones de ejemplo, como hace el agente. Tiene que acertar en las tres.
import { cpSync, existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join, relative, resolve } from "node:path";
import { lineasDeFijas, REPO, SKILL } from "../proyecto.mjs";
import { conBarras } from "../plataforma.mjs";

const CARPETAS = [".agents/skills", ".claude/skills", ".opencode/skills"];
// Las skills que trae el curso. La del alumno es cualquier otra.
const DEL_CURSO = new Set(["build-brief", "harness-starter", "feature-spec", "feature-validator", "corrector"]);

/** Frontmatter sencillo: claves de una línea, con o sin comillas, y bloques "|" o ">". */
export function frontmatter(md) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(md);
  if (!m) return null;
  const datos = {};
  const lineas = m[1].split(/\r?\n/);
  for (let i = 0; i < lineas.length; i++) {
    const c = /^([A-Za-z][\w-]*):\s*(.*)$/.exec(lineas[i]);
    if (!c) continue;
    let valor = c[2].trim();
    if (/^[|>][-+]?$/.test(valor)) {
      const bloque = [];
      while (i + 1 < lineas.length && /^\s+\S|^\s*$/.test(lineas[i + 1])) bloque.push(lineas[++i].trim());
      valor = bloque.join(" ").trim();
    }
    datos[c[1]] = valor.replace(/^(["'])([\s\S]*)\1$/, "$2");
  }
  return { datos, cuerpo: m[2] };
}

/** Todas las skills de un repo: { nombre, carpeta, ruta, datos, cuerpo }. Sin repetir las enlazadas. */
export function skillsDe(raiz) {
  const vistas = new Map();
  for (const carpeta of CARPETAS) {
    const dir = join(raiz, carpeta);
    if (!existsSync(dir)) continue;
    for (const nombre of readdirSync(dir)) {
      const ruta = join(dir, nombre, "SKILL.md");
      if (!existsSync(ruta) || vistas.has(nombre)) continue;
      const fm = frontmatter(readFileSync(ruta, "utf8").replace(/\r\n/g, "\n"));
      vistas.set(nombre, { nombre, carpeta: join(dir, nombre), ruta, datos: fm?.datos ?? null, cuerpo: fm?.cuerpo ?? "" });
    }
  }
  return [...vistas.values()];
}

function elegirSkill(raiz, fichero) {
  if (fichero) {
    const ruta = resolve(fichero);
    const directa = basename(ruta) === "SKILL.md" ? ruta : join(ruta, "SKILL.md");
    if (existsSync(directa)) {
      const fm = frontmatter(readFileSync(directa, "utf8").replace(/\r\n/g, "\n"));
      return { nombre: basename(dirname(directa)), carpeta: dirname(directa), ruta: directa, datos: fm?.datos ?? null, cuerpo: fm?.cuerpo ?? "" };
    }
    const porNombre = skillsDe(raiz).find((s) => s.nombre === basename(fichero));
    if (porNombre) return porNombre;
    throw new Error(`No encuentro la skill ${fichero}. Pasa su nombre o la ruta de su SKILL.md.`);
  }
  const propias = skillsDe(raiz).filter((s) => !DEL_CURSO.has(s.nombre));
  if (propias.length === 0) throw new Error("No encuentro ninguna skill tuya en .agents/skills/. Créala antes, por ejemplo en .agents/skills/descripcion-pr/SKILL.md.");
  if (propias.length > 1) throw new Error(`Hay varias skills tuyas (${propias.map((s) => s.nombre).join(", ")}). Dime cuál corrijo: corregir.mjs 8 <nombre>`);
  return propias[0];
}

function comprobacionesFijas(skill) {
  const fijas = [];
  const { datos } = skill;
  if (!datos) return [{ ok: false, t: "SKILL.md no empieza con un frontmatter entre líneas ---" }];
  fijas.push(datos.name ? { ok: true, t: `Tiene nombre: ${datos.name}` } : { ok: false, t: 'Falta "name" en el frontmatter' });
  if (datos.name) {
    fijas.push(
      datos.name === skill.nombre
        ? { ok: true, t: "El nombre coincide con la carpeta" }
        : { ok: false, t: `El nombre (${datos.name}) no coincide con la carpeta (${skill.nombre})` },
    );
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(datos.name)) fijas.push({ ok: false, t: "El nombre solo puede llevar minúsculas, números y guiones" });
  }
  const descripcion = datos.description ?? "";
  if (!descripcion) fijas.push({ ok: false, t: 'Falta "description" en el frontmatter' });
  else if (descripcion.length > 1024) fijas.push({ ok: false, t: `La descripción tiene ${descripcion.length} caracteres. El máximo es 1024` });
  else fijas.push({ ok: true, t: `Tiene descripción (${descripcion.length} caracteres)` });
  const palabras = skill.cuerpo.split(/\s+/).filter(Boolean).length;
  fijas.push(palabras >= 20 ? { ok: true, t: `Tiene instrucciones (${palabras} palabras)` } : { ok: false, t: "Casi no tiene instrucciones debajo del frontmatter" });
  return fijas;
}

async function revisar({ skill, raiz, modelo }) {
  const sistema = readFileSync(join(SKILL, "rubricas", "ejercicio-8.md"), "utf8").replace(/\r\n/g, "\n");
  const entrada = { nombre: skill.datos.name, descripcion: skill.datos.description, instrucciones: skill.cuerpo.slice(0, 8000) };
  const { datos: rubrica, coste: c1 } = await modelo(sistema, JSON.stringify(entrada, null, 2), {
    claves: ["peticiones"],
    valida: (d) => Array.isArray(d.peticiones) && d.peticiones.length === 3 && d.peticiones.every((p) => typeof p?.texto === "string"),
  });

  // Como el agente: solo nombre y descripción de todas las skills (las del repo y las del curso).
  const catalogo = new Map();
  for (const s of [...skillsDe(REPO), ...skillsDe(raiz)]) {
    if (s.datos?.name && s.datos?.description && s.nombre !== skill.nombre) catalogo.set(s.nombre, s.datos.description);
  }
  catalogo.set(skill.datos.name, skill.datos.description);
  const peticiones = (rubrica?.peticiones ?? []).slice(0, 3);
  const sistemaSeleccion = readFileSync(join(SKILL, "rubricas", "ejercicio-8-seleccion.md"), "utf8").replace(/\r\n/g, "\n");
  const { datos: seleccion, coste: c2 } = await modelo(
    sistemaSeleccion,
    JSON.stringify({ skills: [...catalogo].map(([name, description]) => ({ name, description })), peticiones: peticiones.map((p, i) => ({ n: i + 1, texto: p.texto })) }, null, 2),
    { claves: ["elecciones"], valida: (d) => Array.isArray(d.elecciones) && peticiones.every((_, i) => d.elecciones.some((e) => Number(e?.n) === i + 1)) },
  );
  const elegidas = new Map((seleccion?.elecciones ?? []).map((e) => [Number(e.n), e.skill]));
  const pruebas = peticiones.map((p, i) => {
    const elegida = elegidas.get(i + 1) ?? "ninguna";
    const seActiva = elegida === skill.datos.name;
    return { ...p, elegida, acierta: seActiva === Boolean(p.debe_activarse) };
  });
  return { rubrica, pruebas, coste: (c1 ?? 0) + (c2 ?? 0) };
}

export async function corregirEjercicio({ raiz, fichero, modelo }) {
  const skill = elegirSkill(raiz, fichero);
  const fijas = comprobacionesFijas(skill);
  const l = [`Corrector · ejercicio 8 · ${conBarras(relative(raiz, skill.ruta))}`, "", "Comprobaciones fijas", ...lineasDeFijas(fijas)];
  let problemas = 0;
  let aciertos = null;
  let coste = null;
  if (fijas.every((f) => f.ok)) {
    const r = await revisar({ skill, raiz, modelo });
    coste = r.coste;
    l.push("", "La descripción y las instrucciones (modelo chat de DevExpert Inference)");
    for (const [clave, texto] of [["que_hace", "Dice qué hace"], ["cuando", "Dice cuándo usarla"], ["instrucciones", "Las instrucciones son concretas"]]) {
      const v = r.rubrica?.[clave];
      if (v?.ok) l.push(`  ✓ ${texto}`);
      else {
        problemas++;
        l.push(`  ⚠ ${texto}: no${v?.motivo ? `. ${v.motivo}` : ""}`);
      }
    }
    if (r.rubrica?.sugerencia) l.push(`  · Sugerencia: ${r.rubrica.sugerencia}`);
    l.push("", "¿Se carga cuando toca? (el modelo solo ve el nombre y la descripción de cada skill)");
    aciertos = r.pruebas.filter((p) => p.acierta).length;
    for (const p of r.pruebas) {
      const esperado = p.debe_activarse ? "debería cargarla" : "no debería cargarla";
      l.push(`  ${p.acierta ? "✓" : "⚠"} "${p.texto}": ${esperado} y ${p.elegida === skill.datos.name ? "la carga" : p.elegida === "ninguna" ? "no carga ninguna" : `carga ${p.elegida}`}`);
    }
    if (r.pruebas.length < 3 || aciertos < r.pruebas.length) {
      problemas++;
      l.push("  Cambia la descripción para que diga con las palabras de esas peticiones cuándo se usa y cuándo no.");
    }
  }
  const veredicto = fijas.every((f) => f.ok) && problemas === 0 ? "accept" : "revise";
  l.push(
    "",
    veredicto === "accept"
      ? "Veredicto: accept. Tu skill está bien formada y se carga cuando toca. Pruébala en una sesión nueva."
      : "Veredicto: revise. Corrige lo marcado y vuelve a pasar el corrector.",
  );
  if (coste) l.push(`(revisión: ${coste.toFixed(4)} $)`);
  return { veredicto, fijasOk: fijas.every((f) => f.ok), problemas, texto: l.join("\n") };
}

/**
 * Casos de calibración: cada carpeta de pruebas/ejercicio-8/ tiene la skill de un alumno (<nombre>/SKILL.md).
 * Se copia a .agents/skills/ de un repo temporal. Fuera de una carpeta de skills, el agente no las carga.
 */
export function prepararCaso({ carpeta, caso }) {
  const raiz = mkdtempSync(join(tmpdir(), "corrector-8-"));
  cpSync(join(carpeta, caso), join(raiz, ".agents", "skills"), { recursive: true });
  return { raiz, limpiar: () => rmSync(raiz, { recursive: true, force: true }) };
}
