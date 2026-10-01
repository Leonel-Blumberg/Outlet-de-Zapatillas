# Frontend · React + Vite

```bash
npm install
npm run dev     # http://localhost:5173
npm run build
npm run lint
```

## Estructura

```
src/
  api/          llamadas HTTP (http.js), endpoints de auth (auth.js) y backend simulado (mockAuth.js)
  components/   layout de login/registro, campos de formulario, rutas protegidas
  context/      AuthContext: sesión del usuario (login, registro, logout)
  pages/        LoginPage, RegisterPage, DashboardPage
  styles/       estilos globales y tokens de color
  utils/        validaciones de formularios
  config.js     nombre de la app, URL de la API y modo simulado
```

## Rutas

| Ruta | Acceso | Pantalla |
| --- | --- | --- |
| `/login` | solo sin sesión | Inicio de sesión |
| `/registro` | solo sin sesión | Registro de usuario |
| `/tablero` | solo con sesión | Tablero (por ahora, pantalla de bienvenida) |

Cualquier otra ruta redirige a `/tablero` y, sin sesión, termina en `/login`.

## Variables de entorno

| Variable | Default | Uso |
| --- | --- | --- |
| `VITE_USE_MOCK` | `false` | `false`: login contra la API ASP.NET. `true`: contra usuarios simulados en el navegador (sin backend). |
| `VITE_API_PROXY_TARGET` | `http://localhost:5000` | Backend al que Vite redirige `/api` en desarrollo. |
| `VITE_API_URL` | `/api` | Prefijo de la API (para builds de producción). |

Para pisar los valores sin tocar archivos versionados, crear `.env.development.local`.
