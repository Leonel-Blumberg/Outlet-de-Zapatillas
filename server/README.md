# Backend · ASP.NET Core Web API

API en C# (.NET 10) que valida el login contra PostgreSQL. El acceso a datos es con **Npgsql + Dapper**: las consultas son SQL escrito a mano y parametrizado, sin ORM.

```
server/
  db/
    01_crear_tablas.sql       tablas del DER con sus PK, FK, UNIQUE y CHECK
    02_siembra_usuarios.sql   cuentas de prueba con la contraseña hasheada
  OutletApi/
    Controllers/AuthController.cs   POST /api/auth/login, POST /api/auth/register, GET /api/auth/me
    Data/UsuariosRepository.cs      consultas SQL sobre la tabla usuarios
    Data/DatabaseInitializer.cs     crea la base y ejecuta los scripts de db/ al arrancar
    Services/TokenService.cs        genera el token JWT
    Models/, Dtos/                  fila de usuarios y cuerpos de la API
    Program.cs                      configuración (conexión, JWT, PasswordHasher)
```

## Cómo correrlo

Requisitos: [.NET SDK 10](https://dotnet.microsoft.com/download) y PostgreSQL (probado con las versiones 16 y 17) corriendo en `localhost:5432`.

```bash
cd server/OutletApi
dotnet run
```

Queda escuchando en http://localhost:5000. Al arrancar:

1. Crea la base `outlet_zapatillas` si no existe.
2. Ejecuta `db/01_crear_tablas.sql` y `db/02_siembra_usuarios.sql`, en orden y dentro de una transacción. Los dos scripts se pueden correr varias veces sin duplicar nada.

Para no inicializar la base al arrancar, poner `Database:InicializarAlArrancar` en `false`. Los scripts también se pueden ejecutar a mano desde psql o pgAdmin.

## Configuración

Los valores de desarrollo están en `appsettings.Development.json`:

| Clave                      | Default                                                                                   | Uso                                       |
| -------------------------- | ----------------------------------------------------------------------------------------- | ----------------------------------------- |
| `ConnectionStrings:Outlet` | `Host=localhost;Port=5432;Database=outlet_zapatillas;Username=postgres;Password=postgres` | Conexión a PostgreSQL                     |
| `Jwt:Key`                  | clave de desarrollo                                                                       | Firma de los tokens (32 caracteres o más) |
| `Jwt:ExpiraHoras`          | `8`                                                                                       | Duración de la sesión                     |

Si tu usuario `postgres` tiene otra contraseña, no cambies el archivo versionado: usá los secretos de usuario de .NET, que quedan fuera del repo.

```bash
dotnet user-secrets init
dotnet user-secrets set "ConnectionStrings:Outlet" "Host=localhost;Port=5432;Database=outlet_zapatillas;Username=postgres;Password=TU_CONTRASEÑA"
```

## Contraseñas

Se guardan con `PasswordHasher<Usuario>` de ASP.NET Core Identity: PBKDF2 con HMAC-SHA512, sal aleatoria de 128 bits y 100.000 iteraciones. El resultado (versión del algoritmo, iteraciones, sal y hash) va en un único string en `usuarios.password_hash`. La contraseña nunca se guarda ni se devuelve.

Para sembrar un usuario nuevo, generar su hash con:

```bash
dotnet run -- hash MiContraseña123
```

y copiarlo en `db/02_siembra_usuarios.sql`.

## Probar la API sin el frontend

```bash
curl -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"admin@outlet.com\",\"password\":\"Admin1234\"}"
```

El contrato completo (rutas, cuerpos, respuestas y mensajes de error) está en el [README principal](../README.md#contrato-de-la-api-de-autenticación).
