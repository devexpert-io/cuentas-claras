// Tests del curso para ver-saldos y liquidar. El corrector los copia a tests/, los ejecuta y los borra.
// Siguen la interfaz que pide el enunciado del ejercicio final:
//   pnpm cuentas saldos "<grupo>"    → una línea por miembro: "Ana: -3,34 €", "Carlos: +6,67 €", "Bea: 0,00 €"
//   pnpm cuentas liquidar "<grupo>"  → una línea por pago: "Ana paga 3,34 € a Carlos"
// Y la de gasto anotar del ejercicio 6.
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ejecutar } from "../src/cli.ts";

let raiz: string;
let datos: string;

beforeEach(() => {
  raiz = mkdtempSync(join(tmpdir(), "corrector-final-"));
  datos = join(raiz, "datos");
});

afterEach(() => {
  rmSync(raiz, { recursive: true, force: true });
});

const cuentas = (...args: string[]) => ejecutar(args, { CUENTAS_DIR: datos });

function ok(...args: string[]) {
  const r = cuentas(...args);
  expect(r.codigo, `${args.join(" ")}\n${r.salida}`).toBe(0);
  return r.salida;
}

function foto(): Record<string, string> {
  if (!existsSync(datos)) return {};
  return Object.fromEntries(readdirSync(datos).map((f) => [f, readFileSync(join(datos, f), "utf8")]));
}

const sinMarcas = (linea: string) => linea.replace(/^[\s>*•·-]+/, "").replace(/[*`]/g, "").trim();
const aCentimos = (signo: string, euros: string, centimos: string) => (signo === "-" || signo === "−" ? -1 : 1) * (Number(euros) * 100 + Number(centimos));

// "Ana: -3,34 €" → { Ana: -334 }. Solo las líneas que empiezan por el nombre de un miembro.
function saldos(salida: string, miembros: readonly string[]): Record<string, number> {
  const resultado: Record<string, number> = {};
  for (const linea of salida.split("\n").map(sinMarcas)) {
    const m = /^(.+?)\s*:\s*([+\-−]?)\s*(\d+),(\d{2})\s*€/.exec(linea);
    if (m && miembros.includes(m[1].trim())) resultado[m[1].trim()] = aCentimos(m[2], m[3], m[4]);
  }
  return resultado;
}

// "Ana paga 3,34 € a Carlos" → { deudor: "Ana", acreedor: "Carlos", centimos: 334 }
function pagos(salida: string): Array<{ deudor: string; acreedor: string; centimos: number }> {
  const resultado = [];
  for (const linea of salida.split("\n").map(sinMarcas)) {
    const m = /^(.+?) paga (\d+),(\d{2})\s*€ a (.+?)\.?$/.exec(linea);
    if (m) resultado.push({ deudor: m[1].trim(), acreedor: m[4].trim(), centimos: aCentimos("", m[2], m[3]) });
  }
  return resultado;
}

function aplicar(inicial: Record<string, number>, lista: ReturnType<typeof pagos>): Record<string, number> {
  const final = { ...inicial };
  for (const p of lista) {
    final[p.deudor] = (final[p.deudor] ?? 0) + p.centimos;
    final[p.acreedor] = (final[p.acreedor] ?? 0) - p.centimos;
  }
  return final;
}

const suma = (s: Record<string, number>) => Object.values(s).reduce((a, b) => a + b, 0);

describe("ver-saldos (tests del curso)", () => {
  it("10,00 € que paga Carlos entre Ana, Bea y Carlos: Carlos +6,67 €, Ana -3,34 € y Bea -3,33 €", () => {
    ok("grupo", "crear", "Piso Lavapiés", "--miembros", "Ana,Bea,Carlos");
    ok("gasto", "anotar", "Piso Lavapiés", "Cena", "--importe", "10,00", "--pagador", "Carlos");
    expect(saldos(ok("saldos", "Piso Lavapiés"), ["Ana", "Bea", "Carlos"])).toEqual({ Ana: -334, Bea: -333, Carlos: 667 });
  });

  it("un grupo sin gastos tiene todos los saldos a cero", () => {
    ok("grupo", "crear", "Viaje", "--miembros", "Bea,Dani");
    expect(saldos(ok("saldos", "Viaje"), ["Bea", "Dani"])).toEqual({ Bea: 0, Dani: 0 });
  });

  it("los saldos suman cero después de muchos gastos", () => {
    const miembros = ["Ana", "Bea", "Carlos", "Dani", "Eva"];
    ok("grupo", "crear", "Casa", "--miembros", miembros.join(","));
    for (let i = 1; i <= 12; i++) {
      const participantes = miembros.filter((_, j) => ((i * 7) >> j) & 1);
      const opciones = participantes.length ? ["--participantes", participantes.join(",")] : [];
      ok("gasto", "anotar", "Casa", `Gasto ${i}`, "--importe", `${(i * 3.17).toFixed(2).replace(".", ",")}`, "--pagador", miembros[i % 5], ...opciones);
      const s = saldos(ok("saldos", "Casa"), miembros);
      expect(Object.keys(s)).toHaveLength(5);
      expect(suma(s)).toBe(0);
    }
  });

  it("ver los saldos no cambia nada de lo guardado", () => {
    ok("grupo", "crear", "Piso", "--miembros", "Ana,Bea");
    ok("gasto", "anotar", "Piso", "Pan", "--importe", "3", "--pagador", "Ana");
    const antes = foto();
    ok("saldos", "Piso");
    expect(foto()).toEqual(antes);
  });
});

describe("liquidar (tests del curso)", () => {
  it("los pagos propuestos dejan todos los saldos a cero en el ejemplo de la cena", () => {
    ok("grupo", "crear", "Piso Lavapiés", "--miembros", "Ana,Bea,Carlos");
    ok("gasto", "anotar", "Piso Lavapiés", "Cena", "--importe", "10,00", "--pagador", "Carlos");
    const lista = pagos(ok("liquidar", "Piso Lavapiés"));
    expect(lista.length).toBeGreaterThan(0);
    expect(lista.length).toBeLessThanOrEqual(2);
    const final = aplicar({ Ana: -334, Bea: -333, Carlos: 667 }, lista);
    expect(Object.values(final).every((x) => x === 0)).toBe(true);
  });

  it("en grupos con muchos gastos, los pagos dejan los saldos a cero y no hay más pagos que miembros menos uno", () => {
    const miembros = ["Ana", "Bea", "Carlos", "Dani", "Eva", "Fran"];
    ok("grupo", "crear", "Viaje largo", "--miembros", miembros.join(","));
    for (let i = 1; i <= 10; i++) {
      const participantes = miembros.filter((_, j) => ((i * 11) >> j) & 1);
      const opciones = participantes.length ? ["--participantes", participantes.join(",")] : [];
      ok("gasto", "anotar", "Viaje largo", `Gasto ${i}`, "--importe", `${(i * 4.33).toFixed(2).replace(".", ",")}`, "--pagador", miembros[(i * 5) % 6], ...opciones);
      const inicial = saldos(ok("saldos", "Viaje largo"), miembros);
      const lista = pagos(ok("liquidar", "Viaje largo"));
      expect(lista.length).toBeLessThanOrEqual(miembros.length - 1);
      for (const p of lista) {
        expect(miembros).toContain(p.deudor);
        expect(miembros).toContain(p.acreedor);
        expect(p.centimos).toBeGreaterThan(0);
      }
      expect(Object.values(aplicar(inicial, lista)).every((x) => x === 0)).toBe(true);
    }
  });

  it("si nadie debe nada, no propone ningún pago", () => {
    ok("grupo", "crear", "Cena", "--miembros", "Ana,Bea");
    expect(pagos(ok("liquidar", "Cena"))).toEqual([]);
  });

  it("liquidar no cambia nada de lo guardado y da siempre lo mismo", () => {
    ok("grupo", "crear", "Piso", "--miembros", "Ana,Bea,Carlos");
    ok("gasto", "anotar", "Piso", "Pan", "--importe", "7", "--pagador", "Ana");
    const antes = foto();
    const primera = ok("liquidar", "Piso");
    expect(ok("liquidar", "Piso")).toBe(primera);
    expect(foto()).toEqual(antes);
  });
});
