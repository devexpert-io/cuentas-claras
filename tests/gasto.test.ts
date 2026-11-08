import { describe, expect, it } from "vitest";
import { anotarGasto, repartirIgual, type GrupoConGastos } from "../src/dominio/gasto.ts";

const piso: GrupoConGastos = { nombre: "Piso Lavapiés", miembros: ["Ana", "Bea", "Carlos"], gastos: [] };

describe("repartirIgual", () => {
  it("10,00 € entre Ana, Bea y Carlos: el céntimo que sobra es para Ana", () => {
    expect(repartirIgual(1000, ["Carlos", "Bea", "Ana"])).toEqual([
      { miembro: "Ana", centimos: 334 },
      { miembro: "Bea", centimos: 333 },
      { miembro: "Carlos", centimos: 333 },
    ]);
  });

  it("ordena sin mayúsculas ni tildes y reparte los sobrantes de uno en uno", () => {
    expect(repartirIgual(1002, ["Bea", "carlos", "Ángel", "Dani"])).toEqual([
      { miembro: "Ángel", centimos: 251 },
      { miembro: "Bea", centimos: 251 },
      { miembro: "carlos", centimos: 250 },
      { miembro: "Dani", centimos: 250 },
    ]);
  });

  it("un céntimo entre tres va entero al primero", () => {
    expect(repartirIgual(1, ["Bea", "Ana", "Carlos"]).map((p) => p.centimos)).toEqual([1, 0, 0]);
  });

  it("las partes suman siempre el importe y nadie recibe más de un céntimo de más", () => {
    for (let importe = 1; importe <= 2000; importe += 7) {
      for (let n = 1; n <= 6; n++) {
        const partes = repartirIgual(importe, ["Ana", "Bea", "Carlos", "Dani", "Eva", "Fran"].slice(0, n));
        expect(partes.reduce((suma, p) => suma + p.centimos, 0)).toBe(importe);
        const valores = partes.map((p) => p.centimos);
        expect(Math.max(...valores) - Math.min(...valores)).toBeLessThanOrEqual(1);
      }
    }
  });

  it("con un solo participante, se lleva todo el importe", () => {
    expect(repartirIgual(999, ["Bea"])).toEqual([{ miembro: "Bea", centimos: 999 }]);
  });
});

describe("anotarGasto", () => {
  it("sin participantes reparte entre todos los miembros y da el id 1", () => {
    const r = anotarGasto(piso, { concepto: "Cena", importe: "10,00", pagador: "Carlos" });
    expect(r).toEqual({
      ok: true,
      gasto: { id: 1, concepto: "Cena", importeCentimos: 1000, pagador: "Carlos", participantes: ["Ana", "Bea", "Carlos"] },
      grupo: { ...piso, gastos: [{ id: 1, concepto: "Cena", importeCentimos: 1000, pagador: "Carlos", participantes: ["Ana", "Bea", "Carlos"] }] },
    });
  });

  it("no cambia el grupo que recibe", () => {
    anotarGasto(piso, { concepto: "Cena", importe: "10", pagador: "Ana" });
    expect(piso.gastos).toEqual([]);
  });

  it("resuelve los nombres a los del grupo y admite un pagador que no participa", () => {
    const r = anotarGasto(piso, { concepto: " Taxi ", importe: "20", pagador: "ana", participantes: ["béa", " carlos"] });
    expect(r.ok && r.gasto).toMatchObject({ concepto: "Taxi", pagador: "Ana", participantes: ["Bea", "Carlos"] });
  });

  it("da al gasto nuevo el mayor id más uno", () => {
    const conGastos: GrupoConGastos = {
      ...piso,
      gastos: [{ id: 7, concepto: "Pan", importeCentimos: 300, pagador: "Ana", participantes: ["Ana"] }],
    };
    const r = anotarGasto(conGastos, { concepto: "Fruta", importe: "4", pagador: "Bea" });
    expect(r.ok && r.gasto.id).toBe(8);
  });

  it.each([
    [{ concepto: "  ", importe: "10", pagador: "Ana" }, "El concepto no puede estar vacío."],
    [{ concepto: "!!", importe: "10", pagador: "Ana" }, 'El concepto "!!" tiene que tener al menos una letra o un número.'],
    [{ concepto: "Cena", importe: "0", pagador: "Ana" }, "El importe tiene que ser mayor que cero."],
    [{ concepto: "Cena", importe: "-3", pagador: "Ana" }, "El importe tiene que ser mayor que cero."],
    [{ concepto: "Cena", importe: "10", pagador: "Dani" }, '"Dani" no es miembro del grupo "Piso Lavapiés".'],
    [{ concepto: "Cena", importe: "10", pagador: "Ana", participantes: ["Ana", "Dani"] }, '"Dani" no es miembro del grupo "Piso Lavapiés".'],
    [{ concepto: "Cena", importe: "10", pagador: "Ana", participantes: ["Ana", "ana"] }, "Ana aparece más de una vez entre los participantes."],
    [{ concepto: "Cena", importe: "10", pagador: "Ana", participantes: ["Ana", "", "Bea"] }, "Hay un nombre vacío en la lista de participantes."],
  ])("rechaza %j", (datos, error) => {
    expect(anotarGasto(piso, datos)).toEqual({ ok: false, error });
  });
});
