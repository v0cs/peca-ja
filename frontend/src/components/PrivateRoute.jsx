import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const PrivateRoute = ({ children, tipoUsuario }) => {
  const { isAuthenticated, user, loading } = useAuth();

  // Mostrar loading enquanto verifica autenticação
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  // Se não estiver autenticado, redirecionar para login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Se especificou tipo de usuário e não corresponde, redirecionar
  if (tipoUsuario) {
    // Se é array, verifica se o tipo do usuário está no array
    const tiposPermitidos = Array.isArray(tipoUsuario) ? tipoUsuario : [tipoUsuario];
    const tipoUsuarioAtual = user?.tipo_usuario || user?.tipo;
    
    if (!tiposPermitidos.includes(tipoUsuarioAtual)) {
      // Redirecionar para dashboard do tipo correto
      if (tipoUsuarioAtual === "cliente") {
        return <Navigate to="/dashboard/cliente" replace />;
      } else if (tipoUsuarioAtual === "autopeca") {
        return <Navigate to="/dashboard/autopeca" replace />;
      } else if (tipoUsuarioAtual === "vendedor") {
        return <Navigate to="/dashboard/vendedor" replace />;
      }
      return <Navigate to="/" replace />;
    }
  }

  return children;
};

export default PrivateRoute;
