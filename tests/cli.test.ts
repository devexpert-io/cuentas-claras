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

  it("la ayuda incluye grupo crear y dice dónde se guardan los datos", () => {
    const r = ejecutar(["ayuda"]);
    expect(r.codigo).toBe(0);
    expect(r.salida).toContain('grupo crear "<nombre>" --miembros Ana,Bea,Carlos');
    expect(r.salida).toContain("CUENTAS_DIR");
  });

  it("la ayuda incluye gasto anotar con su uso", () => {
    expect(ejecutar(["ayuda"]).salida).toContain(
      'gasto anotar "<grupo>" "<concepto>" --importe 12,50 --pagador Ana [--participantes Ana,Bea]',
    );
  });

  it("trata como desconocidas gasto y gasto borrar", () => {
    expect(ejecutar(["gasto"])).toMatchObject({ codigo: 1 });
    expect(ejecutar(["gasto"]).salida).toContain("Orden desconocida: gasto\n");
    expect(ejecutar(["gasto", "borrar", "1"]).salida).toContain("Orden desconocida: gasto borrar\n");
  });

  it("trata como desconocida una orden a medias o con una acción que no existe", () => {
    const aMedias = ejecutar(["grupo"]);
    expect(aMedias.codigo).toBe(1);
    expect(aMedias.salida).toContain("Orden desconocida: grupo\n");

    const sinAccion = ejecutar(["grupo", "borrar", "Piso"]);
    expect(sinAccion.codigo).toBe(1);
    expect(sinAccion.salida).toContain("Orden desconocida: grupo borrar\n");
  });
});
