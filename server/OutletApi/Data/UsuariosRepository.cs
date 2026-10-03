using Dapper;
using Npgsql;
using OutletApi.Models;

namespace OutletApi.Data;

// Consultas SQL sobre la tabla usuarios. Todas usan parámetros (@...) para evitar inyección SQL.
public class UsuariosRepository(NpgsqlDataSource db)
{
    private const string Columnas =
        "id_usuario, nombre, apellido, email, password_hash, rol, id_sucursal, activo, fecha_alta";

    public async Task<Usuario?> BuscarPorEmailAsync(string email)
    {
        await using var conn = await db.OpenConnectionAsync();
        return await conn.QuerySingleOrDefaultAsync<Usuario>(
            $"SELECT {Columnas} FROM usuarios WHERE email = @email",
            new { email });
    }

    public async Task<Usuario?> BuscarPorIdAsync(int id)
    {
        await using var conn = await db.OpenConnectionAsync();
        return await conn.QuerySingleOrDefaultAsync<Usuario>(
            $"SELECT {Columnas} FROM usuarios WHERE id_usuario = @id",
            new { id });
    }

    public async Task<bool> ExisteEmailAsync(string email)
    {
        await using var conn = await db.OpenConnectionAsync();
        return await conn.ExecuteScalarAsync<bool>(
            "SELECT EXISTS (SELECT 1 FROM usuarios WHERE email = @email)",
            new { email });
    }

    // Inserta el usuario y devuelve la fila creada (con id y fecha_alta generados por la base)
    public async Task<Usuario> CrearAsync(Usuario u)
    {
        await using var conn = await db.OpenConnectionAsync();
        return await conn.QuerySingleAsync<Usuario>(
            $"""
            INSERT INTO usuarios (nombre, apellido, email, password_hash, rol, id_sucursal)
            VALUES (@Nombre, @Apellido, @Email, @PasswordHash, @Rol, @IdSucursal)
            RETURNING {Columnas}
            """,
            u);
    }
}
