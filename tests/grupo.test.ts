import { describe, expect, it } from "vitest";
import { claveDeNombre, crearGrupo, normalizarNombre } from "../src/dominio/grupo.ts";

describe("normalizarNombre", () => {
  it("quita los espacios de sobra y conserva mayúsculas y tildes", () => {
    expect(normalizarNombre("  Viaje   a   Oporto ")).toBe("Viaje a Oporto");
    expect(normalizarNombre(" Ángel ")).toBe("Ángel");
  });
});

describe("claveDeNombre", () => {
  it("no distingue mayúsculas, tildes, espacios ni signos", () => {
    expect(claveDeNombre("Piso Lavapiés")).toBe("piso-lavapies");
    expect(claveDeNombre("PISO  lavapies!")).toBe("piso-lavapies");
    expect(claveDeNombre("Ángel")).toBe(claveDeNombre("angel"));
  });

  it("nunca deja barras ni puntos, así que no puede salir de la carpeta de datos", () => {
    expect(claveDeNombre("../fuera")).toBe("fuera");
    expect(claveDeNombre("../../etc/passwd")).toBe("etc-passwd");
  });

  it("conserva letras de otros alfabetos y queda vacía si no hay letras ni números", () => {
    expect(claveDeNombre("李")).toBe("李");
    expect(claveDeNombre("!!!")).toBe("");
  });
});

describe("crearGrupo", () => {
  it("crea el grupo con el nombre y los miembros normalizados, en el orden en que se escribieron", () => {
    expect(crearGrupo("  Viaje   a Oporto ", [" Carlos", "Ana ", "Bea"])).toEqual({
      ok: true,
      grupo: { nombre: "Viaje a Oporto", miembros: ["Carlos", "Ana", "Bea"] },
    });
  });

  it("rechaza un nombre de grupo vacío o solo con espacios", () => {
    const error = { ok: false, error: "El nombre del grupo no puede estar vacío." };
    expect(crearGrupo("", ["Ana", "Bea"])).toEqual(error);
    expect(crearGrupo("   ", ["Ana", "Bea"])).toEqual(error);
  });

  it("rechaza un nombre de grupo sin letras ni números", () => {
    expect(crearGrupo("!!!", ["Ana", "Bea"])).toEqual({
      ok: false,
      error: 'El nombre del grupo "!!!" tiene que tener al menos una letra o un número.',
    });
  });

  it("exige al menos 2 miembros", () => {
    const error = { ok: false, error: "Un grupo necesita al menos 2 miembros." };
    expect(crearGrupo("Cena", ["Ana"])).toEqual(error);
    expect(crearGrupo("Cena", [])).toEqual(error);
  });

  it("rechaza nombres de miembro vacíos o sin letras ni números", () => {
    const vacio = { ok: false, error: "Hay un nombre vacío en la lista de miembros." };
    expect(crearGrupo("Cena", ["Ana", "", "Bea"])).toEqual(vacio);
    expect(crearGrupo("Cena", ["Ana", "  "])).toEqual(vacio);
    expect(crearGrupo("Cena", ["Ana", "?"])).toEqual({
      ok: false,
      error: 'El nombre del miembro "?" tiene que tener al menos una letra o un número.',
    });
  });

  it("rechaza un miembro repetido", () => {
    expect(crearGrupo("Cena", ["Ana", "Bea", "Ana"])).toEqual({ ok: false, error: 'El miembro "Ana" está repetido.' });
  });

  it("trata como el mismo miembro los nombres que solo cambian en mayúsculas o tildes", () => {
    expect(crearGrupo("Cena", ["Ana", "Bea", "ana"])).toEqual({
      ok: false,
      error: '"ana" y "Ana" son el mismo miembro: los nombres no distinguen mayúsculas ni tildes.',
    });
    expect(crearGrupo("Cena", ["Ángel", "Angel"])).toEqual({
      ok: false,
      error: '"Angel" y "Ángel" son el mismo miembro: los nombres no distinguen mayúsculas ni tildes.',
    });
  });
});
