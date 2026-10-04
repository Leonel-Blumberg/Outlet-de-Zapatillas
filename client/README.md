# Frontend · React + Vite

El login y el registro usan la API ASP.NET de [`server/`](../server/), así que el backend tiene que estar corriendo (se puede ver en el [README principal](../README.md#cómo-correr-el-proyecto)).

```bash
npm install
npm run dev     # http://localhost:5173
npm run build
npm run lint
```

## Estructura

```
src/
  api/          llamadas HTTP (http.js) y endpoints de autenticación (auth.js)
  components/   layout de login/registro, campos de formulario, rutas protegidas
  context/      sesión del usuario: AuthProvider (login, registro, logout) y hook useAuth
  pages/        LoginPage, RegisterPage, DashboardPage
  styles/       estilos globales y tokens de color
  utils/        validaciones de formularios
  config.js     nombre de la app, URL de la API y límites de los formularios
```

## Rutas

| Ruta        | Acceso          | Pantalla                         |
| ----------- | --------------- | -------------------------------- |
| `/login`    | solo sin sesión | Inicio de sesión                 |
| `/registro` | solo sin sesión | Registro de usuario              |
| `/tablero`  | solo con sesión | Tablero (pantalla de bienvenida) |

Cualquier otra ruta redirige a `/tablero` y, sin sesión, termina en `/login`.

## Variables de entorno

| Variable                | Default                 | Uso                                                |
| ----------------------- | ----------------------- | -------------------------------------------------- |
| `VITE_API_PROXY_TARGET` | `http://localhost:5000` | Backend al que Vite redirige `/api` en desarrollo. |
| `VITE_API_URL`          | `/api`                  | Prefijo de la API (para builds de producción).     |

Para pisar los valores sin tocar archivos versionados, crear `.env.development.local`.
