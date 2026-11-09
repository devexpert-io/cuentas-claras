// Ejercicio 0 · Primer contacto: entorno, clave del curso, tests y un primer commit. Sin modelo.
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { comprobarClave } from "../modelo.mjs";
import { ejecutarEn, lineasDeFijas } from "../proyecto.mjs";

const ETIQUETA = "inicio-ejercicio-0";

export async function corregirEjercicio({ raiz, entorno = process.env }) {
  const fijas = [];

  const node = Number(process.versions.node.split(".")[0]);
  fijas.push(node >= 22 ? { ok: true, t: `Node ${process.versions.node}` } : { ok: false, t: `Tienes Node ${process.versions.node}. Hace falta la 22 o superior` });

  const pnpm = ejecutarEn(raiz, "pnpm", ["--version"], { env: entorno });
  fijas.push(pnpm.codigo === 0 ? { ok: true, t: `pnpm ${pnpm.salida.trim().split("\n").at(-1)}` } : { ok: false, t: "No encuentro pnpm. Instálalo con 'npm install -g pnpm@latest'" });

  const clave = await comprobarClave(entorno.DEVEXPERT_API_KEY);
  fijas.push(
    clave.ok
      ? { ok: true, t: "La clave del curso funciona con el modelo chat" }
      : { ok: false, t: `La clave del curso no funciona: ${clave.motivo}. Ponla en la terminal con export DEVEXPERT_API_KEY=...` },
  );

  if (pnpm.codigo === 0) {
    const test = ejecutarEn(raiz, "pnpm", ["test"], { env: entorno });
    fijas.push(test.codigo === 0 ? { ok: true, t: "pnpm test pasa" } : { ok: false, t: "pnpm test falla. Ejecuta pnpm install y vuelve a probar" });
  }

  const etiqueta = ejecutarEn(raiz, "git", ["rev-parse", "--verify", "--quiet", `${ETIQUETA}^{commit}`]);
  if (etiqueta.codigo !== 0) {
    fijas.push({ ok: false, t: `No encuentro la etiqueta ${ETIQUETA}. Clona el repo del curso o trae las etiquetas con git fetch --tags` });
  } else {
    const n = Number(ejecutarEn(raiz, "git", ["rev-list", "--count", `${ETIQUETA}..HEAD`]).salida.trim()) || 0;
    fijas.push(
      n > 0
        ? { ok: true, t: `${n === 1 ? "Hay 1 commit tuyo" : `Hay ${n} commits tuyos`} después de ${ETIQUETA}` }
        : { ok: false, t: `No hay ningún commit después de ${ETIQUETA}. Haz tu primer commit` },
    );
  }

  const veredicto = fijas.every((f) => f.ok) ? "accept" : "revise";
  const texto = [
    "Corrector · ejercicio 0 · primer contacto",
    "",
    "Comprobaciones fijas",
    ...lineasDeFijas(fijas),
    "",
    veredicto === "accept" ? "Veredicto: accept. Tu entorno está listo para el curso." : "Veredicto: revise. Arregla lo marcado y vuelve a pasar el corrector.",
  ].join("\n");
  return { veredicto, fallan: fijas.filter((f) => !f.ok).length, texto };
}

/** Casos de calibración: repos de git mínimos con un "pnpm test" que pasa o falla. */
export function prepararCaso({ caso }) {
  const raiz = mkdtempSync(join(tmpdir(), "corrector-0-"));
  const git = (...args) => ejecutarEn(raiz, "git", ["-c", "user.name=Alumno", "-c", "user.email=alumno@example.com", ...args]);
  const testPasa = caso !== "tests-rotos";
  writeFileSync(join(raiz, "package.json"), JSON.stringify({ name: "prueba", private: true, scripts: { test: `node -e "process.exit(${testPasa ? 0 : 1})"` } }));
  git("init", "-q");
  git("add", ".");
  git("commit", "-qm", "base");
  git("tag", ETIQUETA);
  if (caso !== "sin-commit") {
    writeFileSync(join(raiz, "hola.md"), "Hola, soy Alumno.\n");
    git("add", ".");
    git("commit", "-qm", "docs: mi primer commit");
  }
  const entorno = caso === "sin-clave" ? { ...process.env, DEVEXPERT_API_KEY: "" } : caso === "clave-mala" ? { ...process.env, DEVEXPERT_API_KEY: "sk-no-vale" } : process.env;
  return { raiz, entorno, limpiar: () => rmSync(raiz, { recursive: true, force: true }) };
}
