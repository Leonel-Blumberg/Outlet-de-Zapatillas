import { useAuth } from "../context/AuthContext";
import Logo from "../components/Logo";
import { APP_NAME } from "../config";

// Pantalla de destino luego del login. Los indicadores, la semaforizacion y el
// drill down/up se implementan en la segunda entrega (se pueden ver los mockups en /docs).
export default function DashboardPage() {
  const { user, logout } = useAuth();

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-brand">
          <Logo size={32} />
          <span>{APP_NAME}</span>
        </div>
        <div className="topbar-user">
          <div className="avatar" aria-hidden="true">
            {user.nombre?.[0]}
            {user.apellido?.[0]}
          </div>
          <div className="topbar-user-info">
            <strong>
              {user.nombre} {user.apellido}
            </strong>
            <span>{user.email}</span>
          </div>
          <button type="button" className="btn-secondary" onClick={logout}>
            Cerrar sesión
          </button>
        </div>
      </header>

      <main className="dashboard-empty">
        <h1>Hola, {user.nombre}.</h1>
        <p>
          Iniciaste sesión correctamente. El tablero con indicadores de ventas,
          stock y clientes se verán aquí en la próxima entrega.
        </p>
      </main>
    </div>
  );
}
