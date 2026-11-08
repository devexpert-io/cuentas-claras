import { describe, expect, it } from "vitest";
import { leerArgumentos } from "../src/argumentos.ts";

describe("leerArgumentos", () => {
  it("separa los posicionales de las opciones", () => {
    expect(leerArgumentos(["Piso", "--miembros", "Ana,Bea"], ["miembros"])).toEqual({
      ok: true,
      argumentos: { posicionales: ["Piso"], opciones: new Map([["miembros", "Ana,Bea"]]) },
    });
  });

  it("acepta --opcion=valor", () => {
    expect(leerArgumentos(["--miembros=Ana,Bea", "Piso"], ["miembros"])).toEqual({
      ok: true,
      argumentos: { posicionales: ["Piso"], opciones: new Map([["miembros", "Ana,Bea"]]) },
    });
  });

  it("rechaza una opción desconocida", () => {
    expect(leerArgumentos(["Piso", "--miembro", "Ana"], ["miembros"])).toEqual({
      ok: false,
      error: "Opción desconocida: --miembro",
    });
  });

  it("rechaza una opción repetida", () => {
    expect(leerArgumentos(["--miembros", "Ana", "--miembros=Bea"], ["miembros"])).toEqual({
      ok: false,
      error: "La opción --miembros aparece más de una vez.",
    });
  });

  it("rechaza una opción sin valor", () => {
    const error = { ok: false, error: "Falta el valor de --miembros." };
    expect(leerArgumentos(["Piso", "--miembros"], ["miembros"])).toEqual(error);
    expect(leerArgumentos(["--miembros="], ["miembros"])).toEqual(error);
    expect(leerArgumentos(["--miembros", "--otra"], ["miembros", "otra"])).toEqual(error);
  });
});
