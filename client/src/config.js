// Datos generales de la aplicacion
export const APP_NAME = 'Outlet de Zapatillas'

// Prefijo de la API. En desarrollo Vite lo redirige al backend (ver vite.config.js)
export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

// Si es true, el login no llama al backend y usa usuarios simulados
export const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

export const PASSWORD_MIN_LENGTH = 8
