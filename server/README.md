# Backend · ASP.NET Core Web API

Acá va el backend en C# (a cargo del otro integrante del grupo).

Para la primera entrega tiene que cubrir:

- Conexión con PostgreSQL (Npgsql o Entity Framework Core).
- Script de creación de las tablas según el DER ([`../docs/der.mmd`](../docs/der.mmd)).
- Siembra de los usuarios de prueba con la contraseña hasheada (`PasswordHasher<T>`).
- Endpoints `POST /api/auth/login`, `POST /api/auth/register` y `GET /api/auth/me`.

El contrato exacto que espera el frontend (rutas, cuerpos, respuestas y mensajes de error) está en el [README principal](../README.md#contrato-de-la-api-de-autenticación).

El frontend llama a `/api/...` y Vite lo redirige a `http://localhost:5000` por defecto. Si la API corre en otro puerto, cambiar `VITE_API_PROXY_TARGET` en `client/.env.development.local`.
