# Risks and Open Questions

## Blocking Next Phase

- Ninguna. El brief basta para preparar el repo y empezar a construir.

## Implementation-Time Questions

- Cómo se indica en cada orden a qué grupo se refiere. Postura inicial: por su nombre, comparado igual que al crearlo.
- Formato de los importes al escribirlos en la terminal. Postura inicial: coma o punto decimal y como mucho dos decimales ("12,50" o "12.50"). Se muestran siempre como "12,50 €".
- Orden alfabético para los céntimos sobrantes cuando hay tildes o mayúsculas. Postura inicial: el orden del español, sin distinguir mayúsculas ni tildes ("Álvaro" va antes que "Bea").
- Cómo se identifica un gasto para poder borrarlo. Postura inicial: un número dentro del grupo que la CLI muestra al anotarlo.
- Qué lista mostrar cuando hay varias liquidaciones igual de cortas. Postura inicial: siempre la misma para los mismos saldos, elegida con una regla fija, para que se pueda probar.

## Later / Not MVP

- Varias monedas.
- Repartos desiguales, por partes o por porcentajes. Si entran, cambia la regla de reparto y hay que decidir a quién van los céntimos sobrantes.
- Añadir o quitar miembros de un grupo ya creado.
- Editar un gasto. De momento se borra y se anota de nuevo.
- Borrar un grupo o un pago registrado por error.
- Cuentas de usuario, una web, una app móvil y sincronizar entre dispositivos.

## Assumptions

Decisiones tomadas por defecto porque el brief no las cubre. Si alguna no encaja con el grupo, se cambia aquí y en el documento afectado.

- Los documentos, el código, los mensajes de la CLI y los commits van en español.
- Se puede borrar un gasto anotado por error, pero no editarlo.
- Los miembros de un grupo no cambian después de crearlo.
- "De 2 a 10 personas" describe a los usuarios, no es un límite. La única regla de tamaño es el mínimo de 2 miembros.
- Un pago puede ser mayor que lo que debe quien paga.
- Liquidar solo propone pagos. Para que cuenten hay que registrarlos.
- Los datos se guardan en `.cuentas/`, en la carpeta desde la que se ejecuta la CLI. La variable de entorno `CUENTAS_DIR` cambia esa carpeta.
- Sin dependencias de ejecución: solo Node y su biblioteca estándar.

## Risks

- Liquidación mínima: encontrar la lista más corta de pagos es un problema combinatorio. El método voraz (el que más debe le paga al que más le deben) es sencillo, pero no siempre da el mínimo. Con grupos del tamaño habitual se puede buscar el mínimo exacto sin problemas de tiempo, pero hay que medir cuánto tarda con grupos más grandes.
- Céntimos: cualquier cálculo con decimales en lugar de céntimos enteros puede descuadrar los saldos. Las reglas 1, 5 y 9 del modelo de dominio tienen que tener tests.
- Datos locales sin copia: si se borra `.cuentas/`, se pierden las cuentas. La carpeta está fuera de git a propósito.
- Ficheros editados a mano: un JSON roto o con datos imposibles puede romper los cálculos. Al leer un grupo, la CLI tiene que avisar con un mensaje claro en lugar de fallar con un error de Node.

## Research Tasks

- Elegir el algoritmo de la liquidación y comprobarlo contra una búsqueda exhaustiva en grupos pequeños.
