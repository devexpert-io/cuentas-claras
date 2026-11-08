import { describe, expect, it } from "vitest";
import { formatearImporte, parsearImporte } from "../src/dominio/dinero.ts";

describe("parsearImporte", () => {
  it.each([
    ["12", 1200],
    ["12,5", 1250],
    ["12.50", 1250],
    ["12,50", 1250],
    [" 0,01 ", 1],
    ["10,02", 1002],
  ])("lee %s como %i céntimos", (texto, centimos) => {
    expect(parsearImporte(texto)).toEqual({ ok: true, centimos });
  });

  it.each(["0", "0,00", "-3", "-0,50"])("rechaza %s porque no es mayor que cero", (texto) => {
    expect(parsearImporte(texto)).toEqual({ ok: false, error: "El importe tiene que ser mayor que cero." });
  });

  it.each(["12,345", "doce", "12 €", "1.000,00", "+3", "1e3", "", ",50", "12,"])("rechaza %j por su formato", (texto) => {
    const r = parsearImporte(texto);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain("por ejemplo 12,50");
  });

  it("rechaza un importe que no cabe en un entero seguro", () => {
    expect(parsearImporte("999999999999999999").ok).toBe(false);
  });
});

describe("formatearImporte", () => {
  it("escribe euros con coma y dos decimales", () => {
    expect(formatearImporte(1250)).toBe("12,50 €");
    expect(formatearImporte(1)).toBe("0,01 €");
    expect(formatearImporte(1000)).toBe("10,00 €");
    expect(formatearImporte(-334)).toBe("-3,34 €");
  });
});
