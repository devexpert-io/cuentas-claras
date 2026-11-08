// Orden "gasto anotar": anota en un grupo un gasto repartido a partes iguales y lo guarda.

import { guardarGrupo, leerGrupo, type LecturaDeGrupo } from "../almacen.ts";
import { leerArgumentos } from "../argumentos.ts";
import { formatearImporte } from "../dominio/dinero.ts";
import { anotarGasto, repartirIgual } from "../dominio/gasto.ts";
import { normalizarNombre } from "../dominio/grupo.ts";
import { exito, fallo, type Contexto, type Resultado } from "./orden.ts";
import { enumerar } from "./texto.ts";

export const USO_GASTO_ANOTAR =
  'gasto anotar "<grupo>" "<concepto>" --importe 12,50 --pagador Ana [--participantes Ana,Bea]';

export function gastoAnotar(args: string[], contexto: Contexto): Resultado {
  const lectura = leerArgumentos(args, ["importe", "pagador", "participantes"]);
  if (!lectura.ok) {
    return falloDeUso(lectura.error);
  }
  const { posicionales, opciones } = lectura.argumentos;
  if (posicionales.length === 0) {
    return falloDeUso("Falta el nombre del grupo.");
  }
  if (posicionales.length === 1) {
    return falloDeUso("Falta el concepto del gasto.");
  }
  if (posicionales.length > 2) {
    return falloDeUso(`Sobra el argumento "${posicionales[2]}". Si el concepto tiene espacios, escríbelo entre comillas.`);
  }
  const [nombreDelGrupo = "", concepto = ""] = posicionales;
  const importe = opciones.get("importe");
  if (importe === undefined) {
    return falloDeUso("Falta el importe del gasto (--importe).");
  }
  const pagador = opciones.get("pagador");
  if (pagador === undefined) {
    return falloDeUso("Falta quién pagó el gasto (--pagador).");
  }
  const participantes = opciones.get("participantes")?.split(",");

  let leido: LecturaDeGrupo;
  try {
    leido = leerGrupo(contexto.carpetaDeDatos, nombreDelGrupo);
  } catch (error) {
    return fallo(`El grupo "${nombreDelGrupo}" no se puede leer: ${detalle(error)}.`);
  }
  if (leido.estado === "no-existe") {
    return fallo(`No existe un grupo con el nombre "${normalizarNombre(nombreDelGrupo)}".`);
  }
  if (leido.estado === "ilegible") {
    return fallo(`El grupo "${normalizarNombre(nombreDelGrupo)}" no se puede leer: ${leido.detalle}.`);
  }

  const anotacion = anotarGasto(leido.grupo, { concepto, importe, pagador, participantes });
  if (!anotacion.ok) {
    return fallo(anotacion.error);
  }
  const { grupo, gasto } = anotacion;

  try {
    guardarGrupo(contexto.carpetaDeDatos, grupo);
  } catch (error) {
    return fallo(`No se pudo guardar el gasto en ${contexto.carpetaDeDatos}: ${detalle(error)}.`);
  }

  const partes = repartirIgual(gasto.importeCentimos, gasto.participantes).map(
    (parte) => `${parte.miembro} ${formatearImporte(parte.centimos)}`,
  );
  return exito(
    `Gasto ${gasto.id} anotado en "${grupo.nombre}": "${gasto.concepto}", ${formatearImporte(gasto.importeCentimos)}, ` +
      `pagado por ${gasto.pagador}. Partes: ${enumerar(partes)}.`,
  );
}

function falloDeUso(mensaje: string): Resultado {
  return fallo(`${mensaje}\nUso: pnpm cuentas ${USO_GASTO_ANOTAR}`);
}

function detalle(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
