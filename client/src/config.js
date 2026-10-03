// Datos generales de la aplicacion
export const APP_NAME = 'Outlet de Zapatillas'

// Prefijo de la API. En desarrollo Vite lo redirige al backend (ver vite.config.js)
export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

// Límites de los formularios: los mismos que valida el backend (AuthController.cs)
export const PASSWORD_MIN_LENGTH = 8
export const PASSWORD_MAX_LENGTH = 100
export const NAME_MAX_LENGTH = 60
export const EMAIL_MAX_LENGTH = 120
