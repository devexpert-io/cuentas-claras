import { ejecutar } from "./cli.ts";

const { salida, codigo } = ejecutar(process.argv.slice(2));
(codigo === 0 ? console.log : console.error)(salida);
process.exitCode = codigo;
