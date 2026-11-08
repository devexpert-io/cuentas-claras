// Llamada al modelo de DevExpert Inference (API compatible con OpenAI) pidiendo JSON.

const BASE = process.env.DEVEXPERT_BASE_URL ?? "https://inference.devexpert.io/v1";
const MODELO = process.env.DEVEXPERT_MODEL ?? "chat";
const TIEMPO_MAXIMO = 120_000;
// Tope de tokens de salida (incluido el razonamiento). Con el esfuerzo de razonamiento por defecto, el modelo
// a veces se queda razonando sin parar (32.000 tokens y casi 4 céntimos sin respuesta). Con "low" responde en
// unos segundos y, si aun así se pasa del tope, se reintenta.
const MAX_TOKENS = 16_000;
const ESFUERZO = process.env.DEVEXPERT_REASONING_EFFORT ?? "low";

/**
 * Devuelve { datos, coste } con la respuesta ya convertida desde JSON. Reintenta si no lo es, si le faltan
 * las claves de `claves`, si `valida` la rechaza, si se corta por el tope de tokens, si tarda más de 2 minutos o si falla el servidor.
 * El coste suma todos los intentos.
 */
export async function llamarModelo(sistema, usuario, { claves = [], valida = () => true } = {}) {
  const clave = process.env.DEVEXPERT_API_KEY;
  if (!clave) {
    throw new Error("Falta DEVEXPERT_API_KEY. Pon la clave del curso en esa variable de entorno.");
  }
  let ultimoError;
  let coste = null;
  for (let intento = 0; intento < 3; intento++) {
    let r;
    try {
      r = await fetch(`${BASE}/chat/completions`, {
        method: "POST",
        headers: { Authorization: `Bearer ${clave}`, "Content-Type": "application/json" },
        signal: AbortSignal.timeout(TIEMPO_MAXIMO),
        body: JSON.stringify({
          model: MODELO,
          temperature: 0,
          max_tokens: MAX_TOKENS,
          reasoning_effort: ESFUERZO,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: sistema },
            { role: "user", content: usuario },
          ],
        }),
      });
    } catch (e) {
      // Sin respuesta a tiempo o sin conexión: se reintenta.
      ultimoError = e;
      continue;
    }
    if (r.status >= 500) {
      ultimoError = new Error(`DevExpert Inference respondió ${r.status}`);
      continue;
    }
    if (!r.ok) throw new Error(`DevExpert Inference respondió ${r.status}: ${(await r.text()).slice(0, 200)}`);
    const d = await r.json();
    if (d.usage?.cost != null) coste = (coste ?? 0) + d.usage.cost;
    if (d.choices?.[0]?.finish_reason === "length") {
      ultimoError = new Error("la respuesta se ha cortado por largo");
      continue;
    }
    try {
      const datos = JSON.parse(d.choices[0].message.content);
      const faltan = claves.filter((c) => !(datos && typeof datos === "object" && c in datos));
      if (datos && typeof datos === "object" && faltan.length === 0 && valida(datos)) return { datos, coste };
      ultimoError = new Error(faltan.length ? `a la respuesta le falta ${faltan.join(", ")}` : "la respuesta no tiene la forma que pide la rúbrica");
    } catch (e) {
      ultimoError = e;
    }
  }
  throw new Error(`El modelo no ha devuelto una respuesta válida (${ultimoError.message}).`);
}

/** Hace la llamada más pequeña posible al modelo para ver si la clave funciona. Devuelve { ok, motivo }. */
export async function comprobarClave(clave) {
  if (!clave) return { ok: false, motivo: "falta DEVEXPERT_API_KEY" };
  try {
    const r = await fetch(`${BASE}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${clave}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: MODELO, max_tokens: 1, messages: [{ role: "user", content: "hola" }] }),
    });
    if (r.ok) return { ok: true, motivo: "" };
    if (r.status === 401 || r.status === 403) return { ok: false, motivo: "DevExpert Inference no acepta la clave" };
    if (r.status === 429) return { ok: false, motivo: "la clave ha llegado a su tope de gasto o de peticiones" };
    return { ok: false, motivo: `DevExpert Inference respondió ${r.status}` };
  } catch (e) {
    return { ok: false, motivo: `no se puede conectar con DevExpert Inference (${e.message})` };
  }
}
