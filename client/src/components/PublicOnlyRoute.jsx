import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Spinner from "./Spinner";

// Login y registro: si el usuario ya inicio sesión, se lo manda directo al tablero
export default function PublicOnlyRoute() {
  const { isAuth, loading } = useAuth();
  if (loading) return <Spinner />;
  return isAuth ? <Navigate to="/tablero" replace /> : <Outlet />;
}
