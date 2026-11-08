# Build Brief

## Problem

Los grupos que comparten gastos (una casa, un viaje, una cena) no saben quién debe cuánto. Las cuentas se pierden entre mensajes y fórmulas, y los céntimos que no cuadran acaban en discusiones.

## Current Workaround / Existing System

Un chat del grupo o una hoja de cálculo compartida. Cada uno apunta lo que paga como puede y al final alguien hace las cuentas a mano.

## Target Users

- Grupos de 2 a 10 personas: compañeros de piso, amigos de viaje o de cena.
- Cualquier miembro usa la herramienta desde la terminal. No hay roles: todos pueden hacer lo mismo.

## Goals

- Saber en todo momento cuánto debe cada miembro o cuánto le deben.
- Que las cuentas cuadren al céntimo: los saldos de un grupo siempre suman cero.
- Que los céntimos sobrantes se repartan con una regla fija y conocida, para que no haya nada que discutir.
- Saldar las cuentas con el menor número de pagos posible.

## Non-Goals

El grupo los deja fuera por ahora:

- Varias monedas. Todo va en euros.
- Repartos desiguales, por partes o por porcentajes. Todos los gastos se reparten a partes iguales.
- Cuentas de usuario, inicio de sesión o permisos.
- Una web o una app móvil.
- Sincronizar los datos entre dispositivos.

## MVP Slice

Una CLI local que hace cinco cosas con un grupo:

1. Crear un grupo con sus miembros.
2. Anotar un gasto: concepto, importe, pagador y participantes (todos los miembros si no se indica nada).
3. Ver el saldo de cada miembro.
4. Liquidar: ver la lista más corta de pagos para que todos queden a cero.
5. Registrar un pago de un miembro a otro.

Además, borrar un gasto anotado por error. El brief no lo pide, pero sin esa opción un error al teclear deja los saldos mal para siempre.

Reglas que el MVP tiene que cumplir desde el principio (detalle en `docs/domain-model.md`):

- Los importes van en euros con dos decimales y por dentro se guardan en céntimos.
- Un gasto se reparte a partes iguales. Si sobran céntimos, se reparten de uno en uno entre los participantes por orden alfabético.
- Los saldos de un grupo siempre suman cero.
- Un importe tiene que ser mayor que cero.

El recorrido que demuestra el MVP: crear un grupo, anotar varios gastos, ver los saldos, liquidar, registrar los pagos propuestos y comprobar que todos los saldos quedan a cero.

## Validation Plan

- Tests automáticos de las reglas de dominio: reparto a partes iguales, céntimos sobrantes, saldos que suman cero y liquidación mínima.
- Tests de la CLI que ejecutan cada orden contra una carpeta de datos temporal.
- Al terminar el MVP, una prueba del recorrido completo con un grupo de ejemplo.

## Success Criteria

- 10,00 € entre Ana, Bea y Carlos dan exactamente 3,34 € para Ana y 3,33 € para Bea y para Carlos.
- En cualquier grupo, la suma de los saldos es 0,00 €.
- Después de registrar los pagos de la liquidación, todos los saldos son cero.
- Un grupo de ejemplo con varios gastos se lleva entero desde la terminal, sin hoja de cálculo.

## Notes

- Superficie: CLI en la terminal, en español. Se usa con `pnpm cuentas <orden>`.
- Stack: Node 22 o superior, TypeScript estricto, Vitest y pnpm con la versión fijada en `package.json`. Sin dependencias de ejecución.
- Datos: ficheros JSON en `.cuentas/`, dentro de la carpeta desde la que se ejecuta la CLI. Esa carpeta ya está en `.gitignore`. Una variable de entorno permite usar otra (la usan los tests).
- Acceso: no hay control de acceso ni nada que revocar. Quien puede abrir la carpeta puede leer y cambiar los datos.
- Operación y observabilidad: no hay servidor ni logs. Cada grupo se ocupa de su carpeta de datos y de sus copias. La CLI escribe los errores con un mensaje claro y termina con un código distinto de cero.
- Diseño visual: no aplica. No hay interfaz gráfica, solo texto en la terminal.
- Idioma: documentos, código, mensajes de la CLI y commits en español.
