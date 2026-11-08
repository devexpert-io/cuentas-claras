# Cuentas claras

Una CLI para repartir los gastos de un grupo: una casa compartida, un viaje o una cena con amigos. Quién ha pagado qué, cuánto le toca a cada uno y quién le debe a quién.

Es el proyecto de referencia del curso de entrada de DevExpert. Empieza casi vacío. En el ejercicio 4 lo preparas para trabajar con agentes y a partir del 5 le vas añadiendo features.

## Requisitos

- Node 22 o superior.
- pnpm. El proyecto fija su versión en `package.json` y pnpm la descarga solo si hace falta.

## Arrancar

```bash
pnpm install
pnpm test
pnpm cuentas ayuda
```

## En Windows

Todo el curso se hace desde una terminal con bash. Tienes dos opciones:

- **Git Bash**, que viene con [Git para Windows](https://git-scm.com/download/win). Abre "Git Bash" y trabaja ahí: `export`, `./init.sh` y el corrector funcionan igual que en los vídeos.
- **WSL**, si ya lo usas. Dentro de WSL todo es Linux.

En PowerShell o en cmd los comandos de los enunciados no valen tal cual. Si tu agente lanza los comandos en PowerShell, dile que ejecute `bash ./init.sh`.
