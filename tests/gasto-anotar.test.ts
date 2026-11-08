import { chmodSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ejecutar } from "../src/cli.ts";

// Escenarios de docs/specs/anotar-gasto.md, a través de ejecutar y con una carpeta temporal.
let raiz: string;
let datos: string;

beforeEach(() => {
  raiz = mkdtempSync(join(tmpdir(), "cuentas-claras-"));
  datos = join(raiz, "datos");
});

afterEach(() => {
  rmSync(raiz, { recursive: true, force: true });
});

function cuentas(...args: string[]) {
  return ejecutar(args, { CUENTAS_DIR: datos });
}

const fichero = (nombre = "piso-lavapies.json") => join(datos, nombre);
const leer = (nombre?: string) => JSON.parse(readFileSync(fichero(nombre), "utf8"));
const texto = (nombre?: string) => readFileSync(fichero(nombre), "utf8");

function crearPiso() {
  expect(cuentas("grupo", "crear", "Piso Lavapiés", "--miembros", "Ana,Bea,Carlos").codigo).toBe(0);
}

describe("gasto anotar", () => {
  it("escenario 1: reparte entre todos y el céntimo que sobra es para Ana aunque pague Carlos", () => {
    crearPiso();
    const r = cuentas("gasto", "anotar", "Piso Lavapiés", "Cena", "--importe", "10,00", "--pagador", "Carlos");
    expect(r).toEqual({
      codigo: 0,
      salida: 'Gasto 1 anotado en "Piso Lavapiés": "Cena", 10,00 €, pagado por Carlos. Partes: Ana 3,34 €, Bea 3,33 € y Carlos 3,33 €.',
    });
    expect(leer().gastos).toEqual([
      { id: 1, concepto: "Cena", importeCentimos: 1000, pagador: "Carlos", participantes: ["Ana", "Bea", "Carlos"] },
    ]);
  });

  it("escenario 2: céntimos sobrantes por orden alfabético, sin mayúsculas ni tildes", () => {
    cuentas("grupo", "crear", "Viaje a Oporto", "--miembros", "Bea,carlos,Ángel,Dani");
    const r = cuentas("gasto", "anotar", "Viaje a Oporto", "Peaje", "--importe", "10,02", "--pagador", "Dani");
    expect(r).toEqual({
      codigo: 0,
      salida:
        'Gasto 1 anotado en "Viaje a Oporto": "Peaje", 10,02 €, pagado por Dani. Partes: Ángel 2,51 €, Bea 2,51 €, carlos 2,50 € y Dani 2,50 €.',
    });
  });

  it("escenario 3: participantes indicados y pagador que no participa", () => {
    crearPiso();
    const r = cuentas("gasto", "anotar", "Piso Lavapiés", "Taxi", "--importe", "20,00", "--pagador", "Ana", "--participantes", "Bea, Carlos");
    expect(r).toEqual({
      codigo: 0,
      salida: 'Gasto 1 anotado en "Piso Lavapiés": "Taxi", 20,00 €, pagado por Ana. Partes: Bea 10,00 € y Carlos 10,00 €.',
    });
    expect(leer().gastos[0]).toMatchObject({ id: 1, pagador: "Ana", participantes: ["Bea", "Carlos"] });
  });

  it("escenario 4: el grupo, el pagador y los participantes se resuelven como los del grupo", () => {
    crearPiso();
    const r = cuentas("gasto", "anotar", "piso lavapies", "Pan", "--importe", "3", "--pagador", "ana", "--participantes", "béa,carlos");
    expect(r.codigo).toBe(0);
    expect(leer().gastos[0]).toMatchObject({ pagador: "Ana", participantes: ["Bea", "Carlos"] });
  });

  it("escenario 5: formatos de importe aceptados", () => {
    crearPiso();
    expect(cuentas("gasto", "anotar", "Piso Lavapiés", "A", "--importe", "12,5", "--pagador", "Ana").salida).toContain("12,50 €, pagado");
    expect(cuentas("gasto", "anotar", "Piso Lavapiés", "B", "--importe=12.50", "--pagador", "Ana").salida).toContain("12,50 €, pagado");
    expect(cuentas("gasto", "anotar", "Piso Lavapiés", "C", "--importe", "12", "--pagador", "Ana").salida).toContain("12,00 €, pagado");
    expect(leer().gastos.map((g: { importeCentimos: number }) => g.importeCentimos)).toEqual([1250, 1250, 1200]);
  });

  it.each(["0", "-3"])("escenario 6: importe %s rechazado sin guardar nada", (importe) => {
    crearPiso();
    const antes = texto();
    const r = cuentas("gasto", "anotar", "Piso Lavapiés", "Cena", "--importe", importe, "--pagador", "Ana");
    expect(r).toEqual({ codigo: 1, salida: "El importe tiene que ser mayor que cero." });
    expect(texto()).toBe(antes);
  });

  describe("escenario 7: otros datos no válidos, sin guardar nada", () => {
    it.each([
      { caso: "importe con tres decimales", args: ["Piso Lavapiés", "Cena", "--importe", "12,345", "--pagador", "Ana"], mensaje: 'El importe "12,345" no es válido' },
      { caso: "importe en letra", args: ["Piso Lavapiés", "Cena", "--importe", "doce", "--pagador", "Ana"], mensaje: 'El importe "doce" no es válido' },
      { caso: "concepto vacío", args: ["Piso Lavapiés", " ", "--importe", "10", "--pagador", "Ana"], mensaje: "El concepto no puede estar vacío." },
      { caso: "sin grupo", args: ["--importe", "10", "--pagador", "Ana"], mensaje: "Falta el nombre del grupo.", uso: true },
      { caso: "sin concepto", args: ["Piso Lavapiés", "--importe", "10", "--pagador", "Ana"], mensaje: "Falta el concepto del gasto.", uso: true },
      { caso: "sin importe", args: ["Piso Lavapiés", "Cena", "--pagador", "Ana"], mensaje: "Falta el importe", uso: true },
      { caso: "sin pagador", args: ["Piso Lavapiés", "Cena", "--importe", "10"], mensaje: "Falta quién pagó", uso: true },
      { caso: "opción desconocida", args: ["Piso Lavapiés", "Cena", "--importe", "10", "--pagador", "Ana", "--moneda", "USD"], mensaje: "Opción desconocida: --moneda", uso: true },
      { caso: "argumento de más", args: ["Piso Lavapiés", "Cena", "de", "--importe", "10", "--pagador", "Ana"], mensaje: 'Sobra el argumento "de"', uso: true },
    ])("$caso", ({ args, mensaje, uso }) => {
      crearPiso();
      const antes = texto();
      const r = cuentas("gasto", "anotar", ...args);
      expect(r.codigo).toBe(1);
      expect(r.salida).toContain(mensaje);
      expect(r.salida.includes("Uso: pnpm cuentas gasto anotar")).toBe(Boolean(uso));
      expect(texto()).toBe(antes);
    });
  });

  it("escenario 8: el grupo no existe y no se crea ningún fichero", () => {
    crearPiso();
    const r = cuentas("gasto", "anotar", "Viaje a Oporto", "Cena", "--importe", "10", "--pagador", "Ana");
    expect(r).toEqual({ codigo: 1, salida: 'No existe un grupo con el nombre "Viaje a Oporto".' });
    expect(readdirSync(datos)).toEqual(["piso-lavapies.json"]);
  });

  it("escenario 8: sin carpeta de datos tampoco se crea nada", () => {
    const r = cuentas("gasto", "anotar", "Viaje a Oporto", "Cena", "--importe", "10", "--pagador", "Ana");
    expect(r.codigo).toBe(1);
    expect(existsSync(datos)).toBe(false);
  });

  describe("escenario 9: pagador o participantes que no son del grupo", () => {
    it.each([
      [["--pagador", "Dani"], '"Dani" no es miembro del grupo "Piso Lavapiés".'],
      [["--pagador", "Ana", "--participantes", "Ana,Dani"], '"Dani" no es miembro del grupo "Piso Lavapiés".'],
      [["--pagador", "Ana", "--participantes", "Ana,ana"], "Ana aparece más de una vez entre los participantes."],
      [["--pagador", "Ana", "--participantes", "Ana,,Bea"], "Hay un nombre vacío en la lista de participantes."],
    ])("%j", (opciones, mensaje) => {
      crearPiso();
      const antes = texto();
      expect(cuentas("gasto", "anotar", "Piso Lavapiés", "Cena", "--importe", "10", ...opciones)).toEqual({ codigo: 1, salida: mensaje });
      expect(texto()).toBe(antes);
    });
  });

  it("escenario 10: un grupo sin gastos guardados se amplía sin perder nada", () => {
    crearPiso();
    expect(leer()).toEqual({ nombre: "Piso Lavapiés", miembros: ["Ana", "Bea", "Carlos"] });
    expect(cuentas("gasto", "anotar", "Piso Lavapiés", "Pan", "--importe", "3", "--pagador", "Bea").codigo).toBe(0);
    expect(leer()).toEqual({
      nombre: "Piso Lavapiés",
      miembros: ["Ana", "Bea", "Carlos"],
      gastos: [{ id: 1, concepto: "Pan", importeCentimos: 300, pagador: "Bea", participantes: ["Ana", "Bea", "Carlos"] }],
    });
  });

  it("escenario 11: los identificadores no se reutilizan", () => {
    crearPiso();
    const anotar = () => cuentas("gasto", "anotar", "Piso Lavapiés", "Pan", "--importe", "3", "--pagador", "Bea");
    expect(anotar().salida).toMatch(/^Gasto 1 anotado/);
    expect(anotar().salida).toMatch(/^Gasto 2 anotado/);
    const grupo = leer();
    grupo.gastos = [{ ...grupo.gastos[1], id: 7 }];
    writeFileSync(fichero(), JSON.stringify(grupo));
    expect(anotar().salida).toMatch(/^Gasto 8 anotado/);
  });

  describe("escenario 12: fichero del grupo ilegible", () => {
    const gasto = { id: 1, concepto: "Pan", importeCentimos: 300, pagador: "Ana", participantes: ["Ana"] };
    it.each([
      ["JSON roto", "{ nombre"],
      ["gastos que no es una lista", JSON.stringify({ nombre: "Piso Lavapiés", miembros: ["Ana", "Bea"], gastos: {} })],
      ["id no entero", JSON.stringify({ nombre: "Piso Lavapiés", miembros: ["Ana", "Bea"], gastos: [{ ...gasto, id: 1.5 }] })],
      ["participante que no es miembro", JSON.stringify({ nombre: "Piso Lavapiés", miembros: ["Ana", "Bea"], gastos: [{ ...gasto, participantes: ["Dani"] }] })],
      ["importe con decimales", JSON.stringify({ nombre: "Piso Lavapiés", miembros: ["Ana", "Bea"], gastos: [{ ...gasto, importeCentimos: 3.5 }] })],
    ])("%s", (_caso, contenido) => {
      mkdirSync(datos, { recursive: true });
      writeFileSync(fichero(), contenido);
      const r = cuentas("gasto", "anotar", "Piso Lavapiés", "Cena", "--importe", "10", "--pagador", "Ana");
      expect(r.codigo).toBe(1);
      expect(r.salida).toMatch(/^El grupo "Piso Lavapiés" no se puede leer: .+\.$/);
      expect(r.salida).not.toContain("    at ");
      expect(texto()).toBe(contenido);
    });
  });

  it("escenario 13: no se puede guardar", () => {
    crearPiso();
    chmodSync(fichero(), 0o444);
    const r = cuentas("gasto", "anotar", "Piso Lavapiés", "Cena", "--importe", "10", "--pagador", "Ana");
    expect(r.codigo).toBe(1);
    expect(r.salida).toMatch(new RegExp(`^No se pudo guardar el gasto en ${datos.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}: .+\\.$`));
    expect(r.salida).not.toContain("    at ");
  });
});
