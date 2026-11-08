// Ejercicio 1 · Mide el contexto: la misma tarea en una sesión nueva y en otra cargada.
// Fijas: la plantilla está completa, los números se pueden leer, la sesión cargada empieza la tarea con más
// contexto y el coste cuadra con los tokens. Rúbrica: que las conclusiones salgan de sus datos.
import { existsSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { campos, entero, importe, lineasDeFijas, partesDe, SKILL, texto, vacio } from "../entrega.mjs";
import { conBarras } from "../plataforma.mjs";

export const ENTREGA = join("ejercicios", "entregas", "01-contexto.md");

// Precios del modelo chat por millón de tokens (vídeo 4).
export const PRECIOS = { entrada: 0.3, cacheada: 0.006, salida: 1.2 };
// Margen para el redondeo del alumno.
const MARGEN = 0.2;

const CAMPOS = [
  ["llamadas", "llamadas al modelo"],
  ["primera", "contexto de la primera llamada"],
  ["entrada", "entrada nueva"],
  ["cacheada", "entrada cacheada"],
  ["salida", "salida"],
  ["coste", "coste"],
  ["resultado", "resultado"],
];
const ANTES = "que hiciste antes de la tarea";

const miles = (x) => String(x).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
const dolares = (x) => `${x.toFixed(4).replace(".", ",")} $`;

function leerSesion(cuerpo, nombre) {
  const c = campos(cuerpo);
  const datos = {};
  const faltan = [];
  for (const [clave, etiqueta] of CAMPOS) {
    const valor = c.get(etiqueta);
    if (vacio(valor)) faltan.push(`${nombre}: ${etiqueta}`);
    datos[clave] = valor ?? "";
  }
  return { datos, faltan, antes: c.get(ANTES) ?? "" };
}

function numeros(d) {
  return {
    llamadas: entero(d.llamadas),
    primera: entero(d.primera),
    entrada: entero(d.entrada),
    cacheada: entero(d.cacheada),
    salida: entero(d.salida),
    coste: importe(d.coste),
  };
}

export const costeEsperado = (n) => (n.entrada * PRECIOS.entrada + n.cacheada * PRECIOS.cacheada + n.salida * PRECIOS.salida) / 1e6;

function comprobacionesFijas(md) {
  const parte = partesDe(md);
  const fijas = [];
  const tarea = texto(parte("Tarea"));
  fijas.push(vacio(tarea) ? { id: "tarea", ok: false, t: "Falta la tarea que has repetido en las dos sesiones" } : { id: "tarea", ok: true, t: "Dice qué tarea has repetido" });

  const nueva = leerSesion(parte("Sesion nueva"), "sesión nueva");
  const cargada = leerSesion(parte("Sesion cargada"), "sesión cargada");
  const faltan = [...nueva.faltan, ...cargada.faltan];
  if (vacio(cargada.antes)) faltan.push(`sesión cargada: ${ANTES.replace("que", "qué")}`);
  const conclusiones = texto(parte("Conclusiones"));
  if (conclusiones.length < 80) faltan.push("conclusiones (unas frases, con tus números)");
  fijas.push(faltan.length ? { id: "plantilla", ok: false, t: `Falta rellenar: ${faltan.join("; ")}` } : { id: "plantilla", ok: true, t: "La plantilla está completa" });

  const n = { nueva: numeros(nueva.datos), cargada: numeros(cargada.datos) };
  const malos = [];
  for (const [sesion, valores] of Object.entries(n)) {
    for (const [clave, v] of Object.entries(valores)) {
      const vacioEnPlantilla = vacio((sesion === "nueva" ? nueva : cargada).datos[clave]);
      const minimo = clave === "cacheada" ? 0 : clave === "coste" ? 0 : 1;
      if (!vacioEnPlantilla && (v === null || v < minimo)) malos.push(`sesión ${sesion}: ${CAMPOS.find((c) => c[0] === clave)[1]}`);
    }
  }
  if (malos.length) fijas.push({ id: "numeros", ok: false, t: `No es un número válido: ${malos.join("; ")}` });

  const completos = (v) => Object.values(v).every((x) => x !== null);
  if (completos(n.nueva) && completos(n.cargada)) {
    fijas.push(
      n.cargada.primera > n.nueva.primera
        ? { id: "contexto", ok: true, t: `La sesión cargada empieza la tarea con más contexto (${miles(n.cargada.primera)} frente a ${miles(n.nueva.primera)} tokens)` }
        : {
            id: "contexto",
            ok: false,
            t: `La sesión cargada empieza la tarea con ${miles(n.cargada.primera)} tokens y la nueva con ${miles(n.nueva.primera)}. La cargada debería llevar más: revisa que has copiado el contexto de la primera llamada de la tarea, y no el de la petición anterior`,
          },
    );
    const malCoste = [];
    for (const [sesion, v] of Object.entries(n)) {
      const esperado = costeEsperado(v);
      if (Math.abs(v.coste - esperado) > Math.max(MARGEN * esperado, 0.0001)) {
        malCoste.push(`en la sesión ${sesion} pones ${dolares(v.coste)} y con esos tokens sale ${dolares(esperado)}`);
      }
    }
    fijas.push(
      malCoste.length
        ? {
            id: "coste",
            ok: false,
            t: `El coste no cuadra con los tokens: ${malCoste.join("; ")}. Recuerda que la entrada cacheada se paga a 0,006 $ por millón, no a 0,30 $`,
          }
        : { id: "coste", ok: true, t: "El coste de las dos sesiones cuadra con sus tokens" },
    );
  }
  return { fijas, tarea, nueva, cargada, n, conclusiones };
}

async function revisarConclusiones({ tarea, nueva, cargada, n, conclusiones, modelo }) {
  const sesion = (s, v) => ({ ...v, resultado: s.datos.resultado });
  const entrada = {
    tarea,
    sesion_nueva: sesion(nueva, n.nueva),
    sesion_cargada: { antes_de_la_tarea: cargada.antes, ...sesion(cargada, n.cargada) },
    conclusiones,
  };
  const sistema = readFileSync(join(SKILL, "rubricas", "ejercicio-1.md"), "utf8").replace(/\r\n/g, "\n");
  return modelo(sistema, JSON.stringify(entrada, null, 2), {
    claves: ["veredicto"],
    valida: (d) => ["propias", "genericas", "contradicen"].includes(d.veredicto),
  });
}

export async function corregirEjercicio({ raiz, fichero, modelo }) {
  const ruta = fichero ? resolve(fichero) : join(raiz, ENTREGA);
  if (!existsSync(ruta)) throw new Error(`No encuentro ${conBarras(relative(raiz, ruta))}. Rellena la plantilla del ejercicio 1.`);
  const md = readFileSync(ruta, "utf8").replace(/\r\n/g, "\n");
  const { fijas, tarea, nueva, cargada, n, conclusiones } = comprobacionesFijas(md);

  const l = [`Corrector · ejercicio 1 · ${conBarras(relative(raiz, ruta))}`, "", "Comprobaciones fijas", ...lineasDeFijas(fijas)];
  let revision = null;
  let coste = null;
  if (fijas.every((f) => f.ok)) {
    const r = await revisarConclusiones({ tarea, nueva, cargada, n, conclusiones, modelo });
    revision = r.datos;
    coste = r.coste;
    l.push("", "Tus conclusiones (modelo chat de DevExpert Inference)");
    if (revision.veredicto === "propias") l.push("  ✓ Salen de tus datos");
    else {
      l.push(`  ⚠ ${revision.veredicto === "genericas" ? "Son genéricas: se podrían escribir sin haber hecho el ejercicio" : "Dicen algo que tus datos no dicen"}`);
      if (revision.cita) l.push(`      "${revision.cita}"`);
      if (revision.motivo) l.push(`      Por qué: ${revision.motivo}`);
    }
    if (revision.sugerencia) l.push(`  · Sugerencia (no bloquea): ${revision.sugerencia}`);
  } else {
    l.push("", "Las conclusiones se revisan cuando las comprobaciones fijas estén bien.");
  }
  const veredicto = fijas.every((f) => f.ok) && revision?.veredicto === "propias" ? "accept" : "revise";
  l.push(
    "",
    veredicto === "accept"
      ? "Veredicto: accept. Has medido el contexto y sabes qué te ha costado."
      : "Veredicto: revise. Corrige lo marcado y vuelve a pasar el corrector.",
  );
  if (coste != null) l.push(`(revisión: ${coste.toFixed(4)} $)`);
  return {
    veredicto,
    fallan: fijas.filter((f) => !f.ok).map((f) => f.id),
    conclusiones: revision?.veredicto ?? null,
    texto: l.join("\n"),
  };
}
