# Context

## Glossary

### Grupo
Personas que comparten gastos: una casa compartida, un viaje o una cena. Tiene un nombre y sus miembros. Los gastos y los pagos siempre pertenecen a un grupo.

### Miembro
Persona que forma parte de un grupo. Es solo un nombre dentro del grupo, no una cuenta de usuario.

### Gasto
Dinero que un miembro adelanta por el grupo. Tiene concepto, importe, pagador y participantes.

### Concepto
Texto corto que dice qué se pagó: "Compra del súper", "Gasolina".

### Importe
Cantidad de dinero en euros, con dos decimales.

### Pagador
Miembro que pagó un gasto.

### Participantes
Miembros entre los que se reparte un gasto. El pagador puede estar entre ellos o no.

### Parte
Lo que le toca pagar a cada participante de un gasto.

### Céntimos sobrantes
Céntimos que quedan cuando un importe no se puede dividir exacto entre los participantes.

### Saldo
Lo que un miembro ha puesto menos lo que le toca. Positivo si le deben y negativo si debe.

### Pago
Dinero que un miembro le da a otro para saldar cuentas. Se registra en el grupo y cambia el saldo de los dos.

### Liquidación
La lista más corta de pagos propuestos para que todos los saldos queden a cero.

### Pago propuesto
Cada línea de una liquidación: quién paga, a quién y cuánto. No cuenta hasta que se registra como pago.

## Rejected / Ambiguous Terms

### Usuario
Usar `Miembro`. Motivo: no hay cuentas de usuario. Un miembro es un nombre dentro de un grupo.

### Deuda
Usar `Saldo`. Motivo: no se guarda quién le debe a quién de dos en dos, solo el saldo de cada miembro frente al grupo. "Debe" quiere decir saldo negativo.

### Pago (dentro de una liquidación)
Usar `Pago propuesto`. Motivo: el brief llama "pagos" tanto a los que propone la liquidación como a los que se registran. Solo los registrados cambian los saldos.
