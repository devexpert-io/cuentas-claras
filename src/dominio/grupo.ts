// Reglas del grupo (regla 3 de docs/domain-model.md). Funciones puras, sin acceso a ficheros.

export interface Grupo {
  nombre: string;
  miembros: string[];
}

export type CreacionDeGrupo = { ok: true; grupo: Grupo } | { ok: false; error: string };

export const MINIMO_DE_MIEMBROS = 2;

// Quita los espacios del principio y del final y deja en uno los espacios seguidos.
export function normalizarNombre(nombre: string): string {
  return nombre.normalize("NFC").trim().replace(/\s+/g, " ");
}

// Dos nombres son el mismo si tienen la misma clave: sin mayúsculas, sin tildes y con
// un guion en lugar de cada tramo de caracteres que no son letras ni números.
// También da el nombre del fichero del grupo, así que nunca contiene "/" ni ".".
export function claveDeNombre(nombre: string): string {
  return nombre
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-|-$/g, "");
}

export function crearGrupo(nombre: string, miembros: readonly string[]): CreacionDeGrupo {
  const nombreDelGrupo = normalizarNombre(nombre);
  if (nombreDelGrupo === "") {
    return fallo("El nombre del grupo no puede estar vacío.");
  }
  if (claveDeNombre(nombreDelGrupo) === "") {
    return fallo(`El nombre del grupo "${nombreDelGrupo}" tiene que tener al menos una letra o un número.`);
  }

  const nombres = miembros.map(normalizarNombre);
  if (nombres.includes("")) {
    return fallo("Hay un nombre vacío en la lista de miembros.");
  }
  const sinLetras = nombres.find((miembro) => claveDeNombre(miembro) === "");
  if (sinLetras !== undefined) {
    return fallo(`El nombre del miembro "${sinLetras}" tiene que tener al menos una letra o un número.`);
  }
  if (nombres.length < MINIMO_DE_MIEMBROS) {
    return fallo(`Un grupo necesita al menos ${MINIMO_DE_MIEMBROS} miembros.`);
  }

  const repetido = buscarRepetido(nombres);
  if (repetido !== undefined) {
    const [primero, segundo] = repetido;
    return fallo(
      primero === segundo
        ? `El miembro "${primero}" está repetido.`
        : `"${segundo}" y "${primero}" son el mismo miembro: los nombres no distinguen mayúsculas ni tildes.`,
    );
  }

  return { ok: true, grupo: { nombre: nombreDelGrupo, miembros: nombres } };
}

function buscarRepetido(nombres: readonly string[]): [string, string] | undefined {
  const vistos = new Map<string, string>();
  for (const nombre of nombres) {
    const clave = claveDeNombre(nombre);
    const anterior = vistos.get(clave);
    if (anterior !== undefined) {
      return [anterior, nombre];
    }
    vistos.set(clave, nombre);
  }
  return undefined;
}

function fallo(error: string): CreacionDeGrupo {
  return { ok: false, error };
}
