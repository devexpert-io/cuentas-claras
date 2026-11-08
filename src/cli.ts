// La CLI como función pura: recibe los argumentos y devuelve lo que hay que mostrar.
// Así se prueba sin lanzar procesos. src/main.ts la conecta con la terminal.

export interface Resultado {
  salida: string;
  codigo: number;
}

export function ayuda(): string {
  return [
    "cuentas: reparte los gastos de un grupo",
    "",
    "Uso: pnpm cuentas <orden> [opciones]",
    "",
    "Órdenes:",
    "  ayuda    muestra esta ayuda",
  ].join("\n");
}

export function ejecutar(args: string[]): Resultado {
  const [orden] = args;
  if (orden === undefined || orden === "ayuda" || orden === "--help") {
    return { salida: ayuda(), codigo: 0 };
  }
  return { salida: `Orden desconocida: ${orden}\n\n${ayuda()}`, codigo: 1 };
}
