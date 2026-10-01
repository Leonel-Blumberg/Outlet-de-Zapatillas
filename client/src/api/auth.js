import { USE_MOCK } from '../config'
import { request } from './http'
import * as mock from './mockAuth'

/*
  Contrato con el backend ASP.NET (ver README.md en la raiz del repo):

  POST /api/auth/login     { email, password }                     -> 200 { token, usuario }
  POST /api/auth/register  { nombre, apellido, email, password }   -> 201 { token, usuario }
  GET  /api/auth/me        (Authorization: Bearer <token>)          -> 200 usuario

  usuario = { id, nombre, apellido, email, rol }
*/

export const loginRequest = (credentials) =>
  USE_MOCK ? mock.login(credentials) : request('/auth/login', { method: 'POST', body: credentials })

export const registerRequest = (data) =>
  USE_MOCK ? mock.register(data) : request('/auth/register', { method: 'POST', body: data })

export const meRequest = () => (USE_MOCK ? mock.me() : request('/auth/me'))
