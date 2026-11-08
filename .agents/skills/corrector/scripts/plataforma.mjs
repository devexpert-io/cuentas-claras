// Lo que cambia entre macOS, Linux y Windows al lanzar otros programas desde el corrector.
import { spawnSync } from "node:child_process";
import { existsSync, realpathSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const WINDOWS = process.platform === "win32";

// En Windows estos no son ejecutables sino guiones .cmd, y Node solo los lanza a través de cmd.exe.
const POR_SHELL = new Set(["pnpm", "npm", "npx", "corepack"]);

/** Entrecomilla un argumento para cmd.exe: lo necesitan las rutas con espacios (C:\Users\Ana María\...). */
export function comillasCmd(arg) {
  const texto = String(arg);
  if (texto !== "" && !/[\s"&|<>^()%!,;=]/.test(texto)) return texto;
  return `"${texto.replace(/"/g, '""')}"`;
}

/** spawnSync que también sirve en Windows. Mismos argumentos y mismo resultado. */
export function lanzar(comando, args = [], opciones = {}) {
  if (WINDOWS && POR_SHELL.has(comando)) {
    return spawnSync(comando, args.map(comillasCmd), { ...opciones, shell: true, windowsHide: true });
  }
  const r = spawnSync(comando, args, { windowsHide: true, ...opciones });
  if (WINDOWS && r.error && /bash/i.test(comando)) {
    const aviso = "No he podido ejecutar bash. En Windows hace falta Git para Windows (trae Git Bash) o WSL. Si lo tienes en otra ruta, ponla en CORRECTOR_BASH.";
    r.stderr = typeof r.stderr === "string" || r.stderr == null ? `${r.stderr ?? ""}\n${aviso}` : r.stderr;
  }
  return r;
}

let bashEncontrado;

/**
 * El bash con el que se ejecuta init.sh. En Windows, "bash" a secas suele ser el lanzador de WSL, así que
 * se busca el de Git para Windows (Git Bash), que está junto a git. Se puede fijar con CORRECTOR_BASH.
 */
export function bash() {
  if (bashEncontrado) return bashEncontrado;
  if (process.env.CORRECTOR_BASH) return (bashEncontrado = process.env.CORRECTOR_BASH);
  if (!WINDOWS) return (bashEncontrado = "bash");
  const candidatos = [];
  const git = spawnSync("git", ["--exec-path"], { encoding: "utf8", windowsHide: true });
  if (git.status === 0) {
    // <Git>/mingw64/libexec/git-core  →  <Git>/bin/bash.exe
    const raizGit = resolve(git.stdout.trim(), "..", "..", "..");
    candidatos.push(join(raizGit, "bin", "bash.exe"), join(raizGit, "usr", "bin", "bash.exe"));
  }
  for (const base of [process.env.ProgramFiles, process.env["ProgramFiles(x86)"], process.env.LOCALAPPDATA && join(process.env.LOCALAPPDATA, "Programs")]) {
    if (base) candidatos.push(join(base, "Git", "bin", "bash.exe"));
  }
  return (bashEncontrado = candidatos.find((c) => existsSync(c)) ?? "bash");
}

/** Una ruta con barras normales, que es lo que esperan git y vitest también en Windows. */
export const conBarras = (ruta) => String(ruta).replaceAll("\\", "/");

/** ¿Se ha lanzado este módulo directamente con node? En Windows la letra de la unidad puede variar de caja. */
export function esElPrincipal(urlDelModulo) {
  if (!process.argv[1]) return false;
  const real = (ruta) => {
    try {
      return realpathSync(ruta);
    } catch {
      return resolve(ruta);
    }
  };
  const a = real(fileURLToPath(urlDelModulo));
  const b = real(process.argv[1]);
  return WINDOWS ? a.toLowerCase() === b.toLowerCase() : a === b;
}
