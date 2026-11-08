import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { carpetaDeDatos } from "../src/almacen.ts";
import { ejecutar } from "../src/cli.ts";

// Cada test usa su propia carpeta temporal. La carpeta de datos todavía no existe al empezar.
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

function ficheros(): string[] {
  return existsSync(datos) ? readdirSync(datos) : [];
}

function leerGrupo(fichero: string): unknown {
  return JSON.parse(readFileSync(join(datos, fichero), "utf8"));
}

describe("grupo crear", () => {
  it("crea el grupo y lo guarda en la carpeta de datos", () => {
    const r = cuentas("grupo", "crear", "Piso Lavapiés", "--miembros", "Ana,Bea,Carlos");
    expect(r).toEqual({ codigo: 0, salida: 'Grupo "Piso Lavapiés" creado con 3 miembros: Ana, Bea y Carlos.' });
    expect(ficheros()).toEqual(["piso-lavapies.json"]);
    expect(leerGrupo("piso-lavapies.json")).toEqual({ nombre: "Piso Lavapiés", miembros: ["Ana", "Bea", "Carlos"] });
  });

  it("acepta --miembros=... y guarda los nombres sin espacios de sobra", () => {
    const r = cuentas("grupo", "crear", "  Viaje   a Oporto ", "--miembros= Ana , Bea ");
    expect(r).toEqual({ codigo: 0, salida: 'Grupo "Viaje a Oporto" creado con 2 miembros: Ana y Bea.' });
    expect(leerGrupo("viaje-a-oporto.json")).toEqual({ nombre: "Viaje a Oporto", miembros: ["Ana", "Bea"] });
  });

  it("usa e delante de un nombre que empieza por el sonido i", () => {
    expect(cuentas("grupo", "crear", "Cena", "--miembros", "Bea,Inés").salida).toContain("Bea e Inés.");
    expect(cuentas("grupo", "crear", "Comida", "--miembros", "Bea,Hilario").salida).toContain("Bea e Hilario.");
    expect(cuentas("grupo", "crear", "Merienda", "--miembros", "Bea,Iara").salida).toContain("Bea y Iara.");
  });

  describe("rechaza sin guardar nada", () => {
    it.each([
      { caso: "sin nombre", args: ["--miembros", "Ana,Bea"], mensaje: "Falta el nombre del grupo." },
      { caso: "sin nada", args: [], mensaje: "Falta el nombre del grupo." },
      { caso: "nombre vacío", args: ["", "--miembros", "Ana,Bea"], mensaje: "El nombre del grupo no puede estar vacío." },
      {
        caso: "nombre sin letras ni números",
        args: ["!!!", "--miembros", "Ana,Bea"],
        mensaje: 'El nombre del grupo "!!!" tiene que tener al menos una letra o un número.',
      },
      { caso: "sin miembros", args: ["Cena"], mensaje: "Faltan los miembros del grupo." },
      { caso: "un solo miembro", args: ["Cena", "--miembros", "Ana"], mensaje: "Un grupo necesita al menos 2 miembros." },
      {
        caso: "miembro vacío",
        args: ["Cena", "--miembros", "Ana,,Bea"],
        mensaje: "Hay un nombre vacío en la lista de miembros.",
      },
      {
        caso: "coma al final",
        args: ["Cena", "--miembros", "Ana,Bea,"],
        mensaje: "Hay un nombre vacío en la lista de miembros.",
      },
      { caso: "miembro repetido", args: ["Cena", "--miembros", "Ana,Bea,Ana"], mensaje: 'El miembro "Ana" está repetido.' },
      {
        caso: "repetido con otra mayúscula",
        args: ["Cena", "--miembros", "Ana,Bea,ana"],
        mensaje: '"ana" y "Ana" son el mismo miembro: los nombres no distinguen mayúsculas ni tildes.',
      },
      {
        caso: "repetido sin tilde",
        args: ["Cena", "--miembros", "Ángel,Angel"],
        mensaje: '"Angel" y "Ángel" son el mismo miembro: los nombres no distinguen mayúsculas ni tildes.',
      },
      { caso: "opción desconocida", args: ["Cena", "--miembro", "Ana,Bea"], mensaje: "Opción desconocida: --miembro" },
      {
        caso: "opción repetida",
        args: ["Cena", "--miembros", "Ana,Bea", "--miembros", "Carlos,Dani"],
        mensaje: "La opción --miembros aparece más de una vez.",
      },
      { caso: "opción sin valor", args: ["Cena", "--miembros"], mensaje: "Falta el valor de --miembros." },
      {
        caso: "nombre con espacios sin comillas",
        args: ["Piso", "Lavapiés", "--miembros", "Ana,Bea"],
        mensaje: 'Sobra el argumento "Lavapiés". Si el nombre tiene espacios, escríbelo entre comillas.',
      },
    ])("$caso", ({ args, mensaje }) => {
      const r = cuentas("grupo", "crear", ...args);
      expect(r.codigo).toBe(1);
      expect(r.salida).toContain(mensaje);
      expect(ficheros()).toEqual([]);
    });
  });

  it("muestra el uso de la orden en los errores de argumentos", () => {
    const r = cuentas("grupo", "crear", "Cena", "--miembro", "Ana,Bea");
    expect(r.salida).toBe(
      'Opción desconocida: --miembro\nUso: pnpm cuentas grupo crear "<nombre>" --miembros Ana,Bea,Carlos',
    );
  });

  it("no crea un grupo que ya existe ni toca el fichero que había", () => {
    cuentas("grupo", "crear", "Piso Lavapiés", "--miembros", "Ana,Bea");
    const antes = readFileSync(join(datos, "piso-lavapies.json"), "utf8");

    for (const nombre of ["Piso Lavapiés", "piso lavapies"]) {
      const r = cuentas("grupo", "crear", nombre, "--miembros", "Carlos,Dani");
      expect(r).toEqual({ codigo: 1, salida: `Ya existe un grupo con el nombre "${nombre}".` });
    }

    expect(readFileSync(join(datos, "piso-lavapies.json"), "utf8")).toBe(antes);
    expect(ficheros()).toEqual(["piso-lavapies.json"]);
  });

  it("guarda dentro de la carpeta de datos aunque el nombre apunte fuera", () => {
    const r = cuentas("grupo", "crear", "../fuera", "--miembros", "Ana,Bea");
    expect(r.codigo).toBe(0);
    expect(ficheros()).toEqual(["fuera.json"]);
    expect(readdirSync(raiz)).toEqual(["datos"]);
  });

  it("avisa con un mensaje claro si no puede guardar el grupo", () => {
    writeFileSync(datos, "esto es un fichero, no una carpeta");
    const r = cuentas("grupo", "crear", "Cena", "--miembros", "Ana,Bea");
    expect(r.codigo).toBe(1);
    expect(r.salida.startsWith(`No se pudo guardar el grupo en ${datos}: `)).toBe(true);
  });
});

describe("carpeta de datos", () => {
  it("es .cuentas en la carpeta de trabajo si CUENTAS_DIR no tiene valor", () => {
    expect(carpetaDeDatos({})).toBe(resolve(".cuentas"));
    expect(carpetaDeDatos({ CUENTAS_DIR: "" })).toBe(resolve(".cuentas"));
  });

  it("es la que indica CUENTAS_DIR", () => {
    expect(carpetaDeDatos({ CUENTAS_DIR: datos })).toBe(datos);
  });
});
