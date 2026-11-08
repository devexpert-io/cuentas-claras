// Separa los argumentos de una orden en posicionales y opciones (--nombre valor o --nombre=valor).

export interface Argumentos {
  posicionales: string[];
  opciones: Map<string, string>;
}

export type LecturaDeArgumentos = { ok: true; argumentos: Argumentos } | { ok: false; error: string };

export function leerArgumentos(args: readonly string[], permitidas: readonly string[]): LecturaDeArgumentos {
  const posicionales: string[] = [];
  const opciones = new Map<string, string>();

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (!arg.startsWith("--")) {
      posicionales.push(arg);
      continue;
    }

    const igual = arg.indexOf("=");
    const nombre = igual === -1 ? arg.slice(2) : arg.slice(2, igual);
    if (!permitidas.includes(nombre)) {
      return fallo(`Opción desconocida: --${nombre}`);
    }
    if (opciones.has(nombre)) {
      return fallo(`La opción --${nombre} aparece más de una vez.`);
    }

    const valor = igual === -1 ? args[++i] : arg.slice(igual + 1);
    if (valor === undefined || valor === "" || valor.startsWith("--")) {
      return fallo(`Falta el valor de --${nombre}.`);
    }
    opciones.set(nombre, valor);
  }

  return { ok: true, argumentos: { posicionales, opciones } };
}

function fallo(error: string): LecturaDeArgumentos {
  return { ok: false, error };
}
