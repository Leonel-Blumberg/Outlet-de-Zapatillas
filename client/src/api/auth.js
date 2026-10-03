import { request } from './http'

/*
  Contrato con el backend ASP.NET (ver README.md en la raiz del repo):

  POST /api/auth/login     { email, password }                     -> 200 { token, usuario }
  POST /api/auth/register  { nombre, apellido, email, password }   -> 201 { token, usuario }
  GET  /api/auth/me        (Authorization: Bearer <token>)          -> 200 usuario

  usuario = { id, nombre, apellido, email, rol }
*/

export const loginRequest = (credentials) => request('/auth/login', { method: 'POST', body: credentials })

export const registerRequest = (data) => request('/auth/register', { method: 'POST', body: data })

export const meRequest = () => request('/auth/me')
