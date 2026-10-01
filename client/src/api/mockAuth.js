// Backend simulado SOLO para desarrollo del frontend mientras la API ASP.NET no esta lista.
// Las cuentas se guardan en el navegador (localStorage). En la app real las contraseñas
// se guardan hasheadas en PostgreSQL y la verificacion la hace el backend.
import { ApiError, tokenStorage } from './http'

const USERS_KEY = 'outlet.mockUsers'

// Mismos usuarios de prueba que la siembra de datos del backend
const SEED_USERS = [
  { id: 1, nombre: 'Admin', apellido: 'Outlet', email: 'admin@outlet.com', password: 'Admin1234', rol: 'admin' },
  { id: 2, nombre: 'Gerente', apellido: 'Centro', email: 'gerente@outlet.com', password: 'Gerente1234', rol: 'gerente' },
]

const delay = (ms = 600) => new Promise((resolve) => setTimeout(resolve, ms))

function loadUsers() {
  try {
    const stored = JSON.parse(localStorage.getItem(USERS_KEY))
    if (Array.isArray(stored)) return stored
  } catch {
    // datos corruptos: se vuelve a la siembra
  }
  return [...SEED_USERS]
}

function saveUsers(users) {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users))
  } catch {
    // modo privado o almacenamiento bloqueado: se ignora
  }
}

const toPublicUser = ({ password: _password, ...user }) => user
const makeToken = (user) => `mock.${btoa(String(user.id))}`

export async function login({ email, password }) {
  await delay()
  const user = loadUsers().find((u) => u.email.toLowerCase() === email.trim().toLowerCase())
  if (!user || user.password !== password) {
    throw new ApiError('Email o contraseña incorrectos.', 401)
  }
  return { token: makeToken(user), usuario: toPublicUser(user) }
}

export async function register({ nombre, apellido, email, password }) {
  await delay()
  const users = loadUsers()
  if (users.some((u) => u.email.toLowerCase() === email.trim().toLowerCase())) {
    throw new ApiError('Ya existe una cuenta con ese email.', 409)
  }
  const user = {
    id: Math.max(0, ...users.map((u) => u.id)) + 1,
    nombre,
    apellido,
    email: email.trim().toLowerCase(),
    password,
    rol: 'consulta',
  }
  saveUsers([...users, user])
  return { token: makeToken(user), usuario: toPublicUser(user) }
}

export async function me() {
  await delay(200)
  const token = tokenStorage.get()
  const id = Number(atob(token?.replace('mock.', '') || '') || NaN)
  const user = loadUsers().find((u) => u.id === id)
  if (!user) throw new ApiError('Sesión expirada.', 401)
  return toPublicUser(user)
}
