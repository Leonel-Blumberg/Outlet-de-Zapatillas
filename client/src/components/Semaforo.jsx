import { COLOR_POR_TONO, SEMAFOROS, estadoSemaforo } from "../utils/semaforo";

// Indicador de semaforización: siempre lleva el texto del estado, no solo el color
export function EstadoBadge({ tipo, estado, etiqueta }) {
  const config = estadoSemaforo(tipo, estado);
  const tono = config?.tono ?? "neutro";
  return (
    <span className={`badge badge-${tono}`}>
      <span className="badge-dot" aria-hidden="true" />
      {etiqueta ?? config?.etiqueta ?? "Sin objetivo"}
    </span>
  );
}

// Referencia que explica qué representa cada color de un semáforo.
// "tarjeta": lista vertical con el color y la explicación; "linea": una sola línea al pie
export function ReferenciasSemaforo({ tipo, variante = "linea", titulo }) {
  const estados = Object.entries(SEMAFOROS[tipo].estados);

  if (variante === "tarjeta")
    return (
      <ul className="referencias-lista">
        {estados.map(([estado, config]) => (
          <li key={estado}>
            <EstadoBadge tipo={tipo} estado={estado} />
            <div>
              <strong>{COLOR_POR_TONO[config.tono]}</strong>
              <p>{config.descripcion}</p>
            </div>
          </li>
        ))}
      </ul>
    );

  return (
    <div className="referencias-linea">
      <strong>{titulo ?? "Referencias"}</strong>
      {estados.map(([estado, config]) => (
        <span key={estado} className="referencia-item">
          <EstadoBadge tipo={tipo} estado={estado} />
          <span>{config.descripcion}</span>
        </span>
      ))}
    </div>
  );
}
