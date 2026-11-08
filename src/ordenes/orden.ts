// Tipos que comparten todas las órdenes de la CLI.

export interface Resultado {
  salida: string;
  codigo: number;
}

export interface Contexto {
  carpetaDeDatos: string;
}

export type Orden = (args: string[], contexto: Contexto) => Resultado;

export function exito(salida: string): Resultado {
  return { salida, codigo: 0 };
}

export function fallo(salida: string): Resultado {
  return { salida, codigo: 1 };
}
