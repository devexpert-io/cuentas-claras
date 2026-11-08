// Reglas del gasto (reglas 2, 4, 5, 6, 7 y 12 de docs/domain-model.md). Funciones puras.

import { parsearImporte } from "./dinero.ts";
import { claveDeNombre, normalizarNombre, type Grupo } from "./grupo.ts";

export interface Gasto {
  id: number;
  concepto: string;
  importeCentimos: number;
  pagador: string;
  participantes: string[];
}

export interface GrupoConGastos extends Grupo {
  gastos: Gasto[];
}

export interface Parte {
  miembro: string;
  centimos: number;
}

export interface DatosDelGasto {
  concepto: string;
  importe: string;
  pagador: string;
  participantes?: readonly string[];
}

export type Anotacion = { ok: true; grupo: GrupoConGastos; gasto: Gasto } | { ok: false; error: string };

// Reparte el importe a partes iguales. Los céntimos sobrantes van de uno en uno a los
// participantes por orden alfabético, sin mayúsculas ni tildes. Devuelve las partes en ese orden.
export function repartirIgual(importeCentimos: number, participantes: readonly string[]): Parte[] {
  const ordenados = [...participantes].sort((a, b) => compararNombres(a, b));
  const base = Math.floor(importeCentimos / ordenados.length);
  const sobrantes = importeCentimos % ordenados.length;
  return ordenados.map((miembro, i) => ({ miembro, centimos: base + (i < sobrantes ? 1 : 0) }));
}

export function compararNombres(a: string, b: string): number {
  const ca = claveDeNombre(a);
  const cb = claveDeNombre(b);
  return ca < cb ? -1 : ca > cb ? 1 : 0;
}

// Valida los datos, resuelve los nombres a los del grupo y devuelve el grupo con el gasto nuevo.
// No cambia el grupo que recibe.
export function anotarGasto(grupo: GrupoConGastos, datos: DatosDelGasto): Anotacion {
  const concepto = normalizarNombre(datos.concepto);
  if (concepto === "") {
    return fallo("El concepto no puede estar vacío.");
  }
  if (claveDeNombre(concepto) === "") {
    return fallo(`El concepto "${concepto}" tiene que tener al menos una letra o un número.`);
  }

  const importe = parsearImporte(datos.importe);
  if (!importe.ok) {
    return importe;
  }

  const pagador = buscarMiembro(grupo, datos.pagador);
  if (pagador === undefined) {
    return fallo(`"${normalizarNombre(datos.pagador)}" no es miembro del grupo "${grupo.nombre}".`);
  }

  let participantes: string[];
  if (datos.participantes === undefined) {
    participantes = [...grupo.miembros];
  } else {
    const resolucion = resolverParticipantes(grupo, datos.participantes);
    if (!resolucion.ok) {
      return resolucion;
    }
    participantes = resolucion.participantes;
  }

  const id = grupo.gastos.reduce((mayor, gasto) => Math.max(mayor, gasto.id), 0) + 1;
  const gasto: Gasto = { id, concepto, importeCentimos: importe.centimos, pagador, participantes };
  return { ok: true, gasto, grupo: { ...grupo, gastos: [...grupo.gastos, gasto] } };
}

function resolverParticipantes(
  grupo: Grupo,
  escritos: readonly string[],
): { ok: true; participantes: string[] } | { ok: false; error: string } {
  const nombres = escritos.map(normalizarNombre);
  if (nombres.length === 0 || nombres.includes("")) {
    return fallo("Hay un nombre vacío en la lista de participantes.");
  }
  const participantes: string[] = [];
  for (const nombre of nombres) {
    const miembro = buscarMiembro(grupo, nombre);
    if (miembro === undefined) {
      return fallo(`"${nombre}" no es miembro del grupo "${grupo.nombre}".`);
    }
    if (participantes.includes(miembro)) {
      return fallo(`${miembro} aparece más de una vez entre los participantes.`);
    }
    participantes.push(miembro);
  }
  return { ok: true, participantes };
}

// El miembro del grupo con la misma clave que el nombre escrito, tal como está guardado.
export function buscarMiembro(grupo: Grupo, nombre: string): string | undefined {
  const clave = claveDeNombre(nombre);
  if (clave === "") {
    return undefined;
  }
  return grupo.miembros.find((miembro) => claveDeNombre(miembro) === clave);
}

function fallo(error: string): { ok: false; error: string } {
  return { ok: false, error };
}
