// Tests del curso para anotar-gasto. El corrector los copia a tests/, los ejecuta y los borra.
// Siguen la interfaz de la spec canónica (docs/specs/anotar-gasto.md en inicio-ejercicio-6):
//   pnpm cuentas gasto anotar "<grupo>" "<concepto>" --importe 12,50 --pagador Ana [--participantes Ana,Bea]
// y la confirmación "... Partes: Ana 3,34 €, Bea 3,33 € y Carlos 3,33 €.".
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ejecutar } from "../src/cli.ts";

let raiz: string;
let datos: string;

beforeEach(() => {
  raiz = mkdtempSync(join(tmpdir(), "corrector-6-"));
  datos = join(raiz, "datos");
});

afterEach(() => {
  rmSync(raiz, { recursive: true, force: true });
});

const cuentas = (...args: string[]) => ejecutar(args, { CUENTAS_DIR: datos });

function crearGrupo(nombre: string, miembros: string) {
  const r = cuentas("grupo", "crear", nombre, "--miembros", miembros);
  expect(r.codigo, r.salida).toBe(0);
}

// Contenido de todos los ficheros de la carpeta de datos, para ver que no cambia nada.
function foto(): Record<string, string> {
  if (!existsSync(datos)) return {};
  return Object.fromEntries(readdirSync(datos).map((f) => [f, readFileSync(join(datos, f), "utf8")]));
}

// "Partes: Ana 3,34 €, Bea 3,33 € y Carlos 3,33 €." → { Ana: 334, Bea: 333, Carlos: 333 }
function partes(salida: string): Record<string, number> {
  const tramo = /Partes:\s*(.+)$/m.exec(salida)?.[1] ?? "";
  const resultado: Record<string, number> = {};
  for (const m of tramo.matchAll(/([^\s,][^,]*?)\s+(\d+),(\d{2})\s*€/g)) {
    const nombre = m[1].replace(/^y\s+|^e\s+/, "").trim();
    resultado[nombre] = Number(m[2]) * 100 + Number(m[3]);
  }
  return resultado;
}

function gastosGuardados(fichero: string): Array<Record<string, unknown>> {
  return JSON.parse(readFileSync(join(datos, fichero), "utf8")).gastos ?? [];
}

describe("anotar-gasto (tests del curso)", () => {
  it("reparto exacto: 10,00 € entre Ana, Bea y Carlos que paga Carlos dan 3,34 € a Ana y 3,33 € a Bea y a Carlos", () => {
    crearGrupo("Piso Lavapiés", "Ana,Bea,Carlos");
    const r = cuentas("gasto", "anotar", "Piso Lavapiés", "Cena", "--importe", "10,00", "--pagador", "Carlos");
    expect(r.codigo, r.salida).toBe(0);
    expect(partes(r.salida)).toEqual({ Ana: 334, Bea: 333, Carlos: 333 });
    const [gasto] = gastosGuardados("piso-lavapies.json");
    expect(gasto).toMatchObject({ importeCentimos: 1000, pagador: "Carlos" });
    expect([...(gasto.participantes as string[])].sort()).toEqual(["Ana", "Bea", "Carlos"]);
  });

  it("céntimos sobrantes de uno en uno por orden alfabético, sin mayúsculas ni tildes, aunque pague otro", () => {
    crearGrupo("Viaje a Oporto", "Bea,carlos,Ángel,Dani");
    const r = cuentas("gasto", "anotar", "Viaje a Oporto", "Peaje", "--importe", "10,02", "--pagador", "Dani");
    expect(r.codigo, r.salida).toBe(0);
    expect(partes(r.salida)).toEqual({ Ángel: 251, Bea: 251, carlos: 250, Dani: 250 });
  });

  it("las partes suman siempre el importe y nadie recibe más de un céntimo de más", () => {
    crearGrupo("Cena", "Ana,Bea,Carlos,Dani,Eva,Fran,Gema");
    for (const [importe, centimos, participantes] of [
      ["0,01", 1, "Ana,Bea,Carlos"],
      ["0,05", 5, "Ana,Bea,Carlos,Dani,Eva,Fran,Gema"],
      ["99,99", 9999, "Gema,Bea"],
      ["100", 10000, "Ana,Bea,Carlos,Dani,Eva,Fran,Gema"],
      ["7,13", 713, "Fran,Eva,Dani"],
    ] as const) {
      const r = cuentas("gasto", "anotar", "Cena", "Compra", "--importe", importe, "--pagador", "Ana", "--participantes", participantes);
      expect(r.codigo, r.salida).toBe(0);
      const valores = Object.values(partes(r.salida));
      expect(valores).toHaveLength(participantes.split(",").length);
      expect(valores.reduce((a, b) => a + b, 0)).toBe(centimos);
      expect(Math.max(...valores) - Math.min(...valores)).toBeLessThanOrEqual(1);
    }
  });

  it("solo reparte entre los participantes indicados, aunque el pagador no esté entre ellos", () => {
    crearGrupo("Piso Lavapiés", "Ana,Bea,Carlos");
    const r = cuentas("gasto", "anotar", "Piso Lavapiés", "Taxi", "--importe", "20,00", "--pagador", "Ana", "--participantes", "Bea,Carlos");
    expect(r.codigo, r.salida).toBe(0);
    expect(partes(r.salida)).toEqual({ Bea: 1000, Carlos: 1000 });
    expect(gastosGuardados("piso-lavapies.json")[0]).toMatchObject({ pagador: "Ana", participantes: ["Bea", "Carlos"] });
  });

  it.each(["0", "-3", "0,00"])("importe %s rechazado sin guardar nada", (importe) => {
    crearGrupo("Piso Lavapiés", "Ana,Bea,Carlos");
    const antes = foto();
    const r = cuentas("gasto", "anotar", "Piso Lavapiés", "Cena", "--importe", importe, "--pagador", "Ana");
    expect(r.codigo).toBe(1);
    expect(r.salida).toContain("mayor que cero");
    expect(foto()).toEqual(antes);
  });

  it("un participante que no es del grupo se rechaza sin guardar nada", () => {
    crearGrupo("Piso Lavapiés", "Ana,Bea,Carlos");
    const antes = foto();
    const r = cuentas("gasto", "anotar", "Piso Lavapiés", "Cena", "--importe", "10", "--pagador", "Ana", "--participantes", "Ana,Dani");
    expect(r.codigo).toBe(1);
    expect(r.salida).toContain("Dani");
    expect(foto()).toEqual(antes);
  });

  it("un pagador que no es del grupo se rechaza sin guardar nada", () => {
    crearGrupo("Piso Lavapiés", "Ana,Bea,Carlos");
    const antes = foto();
    const r = cuentas("gasto", "anotar", "Piso Lavapiés", "Cena", "--importe", "10", "--pagador", "Dani");
    expect(r.codigo).toBe(1);
    expect(r.salida).toContain("Dani");
    expect(foto()).toEqual(antes);
  });

  it("los gastos se acumulan en el grupo con identificadores distintos", () => {
    crearGrupo("Piso Lavapiés", "Ana,Bea,Carlos");
    expect(cuentas("gasto", "anotar", "Piso Lavapiés", "Pan", "--importe", "3", "--pagador", "Ana").codigo).toBe(0);
    expect(cuentas("gasto", "anotar", "Piso Lavapiés", "Fruta", "--importe", "4,50", "--pagador", "Bea").codigo).toBe(0);
    const gastos = gastosGuardados("piso-lavapies.json");
    expect(gastos.map((g) => g.importeCentimos)).toEqual([300, 450]);
    expect(new Set(gastos.map((g) => g.id)).size).toBe(2);
  });
});
