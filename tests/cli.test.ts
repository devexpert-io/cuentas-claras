import { describe, expect, it } from "vitest";
import { ejecutar } from "../src/cli.ts";

describe("cli", () => {
  it("muestra la ayuda si no le pasas ninguna orden", () => {
    const r = ejecutar([]);
    expect(r.codigo).toBe(0);
    expect(r.salida).toContain("Uso: pnpm cuentas <orden>");
  });

  it("falla con una orden que no existe", () => {
    const r = ejecutar(["volar"]);
    expect(r.codigo).toBe(1);
    expect(r.salida).toContain("Orden desconocida: volar");
  });
});
