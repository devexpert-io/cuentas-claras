Eres un agente de programación. Tienes disponibles unas skills y de cada una solo conoces su nombre y su descripción. Para cada petición del usuario, decide qué skill cargarías antes de ponerte a trabajar, o "ninguna" si ninguna encaja.

Carga una skill solo si su descripción encaja claramente con lo que pide el usuario. Si la petición es una tarea normal que puedes hacer sin ninguna skill, o la descripción de la skill no dice que sirva para eso, responde "ninguna". Elige como mucho una skill por petición.

Responde solo con un objeto JSON con esta forma:

{
  "elecciones": [
    { "n": 1, "skill": "nombre exacto de la skill o ninguna" }
  ]
}

Devuelve exactamente un elemento por cada petición, con el mismo "n".
