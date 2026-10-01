import { PASSWORD_MIN_LENGTH } from '../config'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateEmail(email) {
  if (!email.trim()) return 'Ingresá tu email.'
  if (!EMAIL_REGEX.test(email.trim())) return 'Ingresá un email válido.'
  return null
}

export function validateNewPassword(password) {
  if (!password) return 'Ingresá una contraseña.'
  if (password.length < PASSWORD_MIN_LENGTH) return `Debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres.`
  if (!/[a-zA-Z]/.test(password) || !/\d/.test(password)) return 'Debe combinar letras y números.'
  return null
}

export function validateName(value, label) {
  if (!value.trim()) return `Ingresá tu ${label}.`
  if (value.trim().length < 2) return `El ${label} es demasiado corto.`
  return null
}

// Devuelve solo los campos con error
export const compactErrors = (errors) => Object.fromEntries(Object.entries(errors).filter(([, v]) => v))
