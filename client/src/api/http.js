import { API_BASE_URL } from "../config";

const TOKEN_KEY = "outlet.token";

export const tokenStorage = {
  get: () => sessionStorage.getItem(TOKEN_KEY),
  set: (token) => sessionStorage.setItem(TOKEN_KEY, token),
  clear: () => sessionStorage.removeItem(TOKEN_KEY),
};

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

// Envuelve fetch: agrega el token JWT y traduce los errores del backend a mensajes legibles
export async function request(path, { method = "GET", body } = {}) {
  const headers = { "Content-Type": "application/json" };
  const token = tokenStorage.get();
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(
      "No se pudo conectar con el servidor. Intentá de nuevo en unos minutos.",
      0,
    );
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      data?.message ||
      data?.title ||
      (response.status === 401
        ? "Email o contraseña incorrectos."
        : "Ocurrió un error inesperado.");
    throw new ApiError(message, response.status);
  }

  return data;
}
