# Domain Model

## Core Concepts

- **Grupo**: un nombre y sus miembros. Contiene los gastos y los pagos.
- **Miembro**: un nombre dentro del grupo. No tiene más datos.
- **Gasto**: concepto, importe, pagador y participantes.
- **Pago**: un importe que un miembro le da a otro.
- **Saldo**: se calcula a partir de los gastos y los pagos del grupo. No se guarda.
- **Liquidación**: se calcula a partir de los saldos. No se guarda.

## Relationships

- Un grupo tiene 2 o más miembros, y cero o más gastos y pagos.
- Un gasto tiene un pagador y uno o más participantes.
- Un pago tiene un miembro que paga y otro que recibe.
- Cada miembro tiene un saldo, que depende de todos los gastos y pagos del grupo.

## Rules

1. Los importes van en euros con dos decimales. Por dentro se guardan en céntimos, como números enteros: 12,50 € son 1250 céntimos. Nunca se calcula con decimales.
2. Un importe tiene que ser mayor que cero. Vale para gastos y para pagos.
3. Un grupo tiene al menos 2 miembros y cada nombre aparece una sola vez. Dos nombres son el mismo si solo cambian las mayúsculas, las tildes, los espacios o los signos: "Ana" y "ana", "Ángel" y "Angel". Cada nombre se guarda como se escribió, sin espacios de sobra, y tiene que tener al menos una letra o un número.
4. Un gasto se reparte a partes iguales entre sus participantes. Si sobran céntimos, se reparten de uno en uno entre los participantes por orden alfabético. Ejemplo: 10,00 € entre Ana, Bea y Carlos son 3,34 € para Ana y 3,33 € para Bea y para Carlos.
5. Las partes de un gasto suman exactamente su importe.
6. Si no se indican participantes, el gasto se reparte entre todos los miembros del grupo.
7. El pagador y los participantes de un gasto son miembros del grupo. Un pago va de un miembro a otro miembro distinto del mismo grupo.
8. El saldo de un miembro es lo que ha pagado en gastos, menos sus partes, más lo que ha pagado a otros miembros, menos lo que ha recibido de ellos. Positivo: le deben. Negativo: debe.
9. Los saldos de un grupo siempre suman cero.
10. La liquidación es la lista con el menor número de pagos propuestos que deja todos los saldos a cero. Calcularla no cambia nada: los pagos solo cuentan cuando se registran.
11. Dos grupos no pueden tener el mismo nombre, comparado igual que los nombres de los miembros.

## States and Lifecycles

- **Grupo**: se crea con sus miembros y en el MVP ya no cambian. No se añaden ni se quitan miembros, y el grupo no se borra.
- **Gasto**: anotado → borrado. Un gasto no se edita: si tiene un error, se borra y se anota de nuevo. Un gasto borrado deja de contar para los saldos.
- **Pago**: registrado. En el MVP no se edita ni se borra.
- **Saldo** y **liquidación** no tienen estado: se recalculan cada vez con los gastos y pagos que hay.

## Important Scenarios

- Cena de 10,00 € que paga Ana entre Ana, Bea y Carlos: las partes son 3,34 € (Ana), 3,33 € (Bea) y 3,33 € (Carlos). Saldos: Ana +6,66 €, Bea -3,33 € y Carlos -3,33 €. Suman cero.
- Taxi de 20,00 € que paga Bea solo entre Bea y Carlos: Ana no participa y su saldo no cambia.
- Liquidar y pagar: si se registran todos los pagos que propone la liquidación, todos los saldos quedan a cero y una liquidación nueva sale vacía.

## Edge Cases

- Importe que no se divide exacto: siempre sobran menos céntimos que participantes, así que nadie recibe más de un céntimo de más.
- El pagador no está entre los participantes: paga, pero no le toca parte. Por ejemplo, invita a los demás.
- Gasto con un solo participante: ese participante tiene todo el importe. Si es el propio pagador, ningún saldo cambia.
- Grupo sin gastos ni pagos: todos los saldos son cero y la liquidación está vacía.
- Borrar un gasto después de registrar pagos: los saldos se recalculan y la liquidación puede proponer pagos nuevos.
- Pago mayor que lo que debe quien paga: no se impide. Los saldos de los dos cambian de signo y la liquidación lo refleja.
