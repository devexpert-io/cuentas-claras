// Orden "grupo crear": crea un grupo con sus miembros y lo guarda en la carpeta de datos.

import { guardarGrupoNuevo } from "../almacen.ts";
import { leerArgumentos } from "../argumentos.ts";
import { claveDeNombre, crearGrupo } from "../dominio/grupo.ts";
import { exito, fallo, type Contexto, type Resultado } from "./orden.ts";

export const USO_GRUPO_CREAR = 'grupo crear "<nombre>" --miembros Ana,Bea,Carlos';

export function grupoCrear(args: string[], contexto: Contexto): Resultado {
  const lectura = leerArgumentos(args, ["miembros"]);
  if (!lectura.ok) {
    return falloDeUso(lectura.error);
  }
  const { posicionales, opciones } = lectura.argumentos;
  if (posicionales.length === 0) {
    return falloDeUso("Falta el nombre del grupo.");
  }
  if (posicionales.length > 1) {
    return falloDeUso(`Sobra el argumento "${posicionales[1]}". Si el nombre tiene espacios, escríbelo entre comillas.`);
  }
  const miembros = opciones.get("miembros");
  if (miembros === undefined) {
    return falloDeUso("Faltan los miembros del grupo.");
  }

  const creacion = crearGrupo(posicionales[0], miembros.split(","));
  if (!creacion.ok) {
    return fallo(creacion.error);
  }
  const { grupo } = creacion;

  let guardado: "creado" | "ya-existe";
  try {
    guardado = guardarGrupoNuevo(contexto.carpetaDeDatos, grupo);
  } catch (error) {
    const detalle = error instanceof Error ? error.message : String(error);
    return fallo(`No se pudo guardar el grupo en ${contexto.carpetaDeDatos}: ${detalle}`);
  }
  if (guardado === "ya-existe") {
    return fallo(`Ya existe un grupo con el nombre "${grupo.nombre}".`);
  }

  return exito(`Grupo "${grupo.nombre}" creado con ${grupo.miembros.length} miembros: ${enumerar(grupo.miembros)}.`);
}

function falloDeUso(mensaje: string): Resultado {
  return fallo(`${mensaje}\nUso: pnpm cuentas ${USO_GRUPO_CREAR}`);
}

// "Ana, Bea y Carlos". Delante de un nombre que empieza por el sonido i va "e": "Bea e Inés".
function enumerar(nombres: readonly string[]): string {
  const ultimo = nombres[nombres.length - 1];
  if (nombres.length < 2 || ultimo === undefined) {
    return nombres.join("");
  }
  const conjuncion = /^h?i([^aeiou]|$)/.test(claveDeNombre(ultimo)) ? "e" : "y";
  return `${nombres.slice(0, -1).join(", ")} ${conjuncion} ${ultimo}`;
}
