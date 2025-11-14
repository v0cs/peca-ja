import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { Button } from "../ui";
import { Car, LogOut, Plus, Users } from "lucide-react";

const Header = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const getDashboardPath = () => {
    if (user?.tipo_usuario === "cliente") return "/dashboard/cliente";
    if (user?.tipo_usuario === "autopeca") return "/dashboard/autopeca";
    if (user?.tipo_usuario === "vendedor") return "/dashboard/vendedor";
    return "/";
  };

  const getProfilePath = () => {
    if (user?.tipo_usuario === "cliente") return "/cliente/perfil";
    if (user?.tipo_usuario === "autopeca") return "/autopeca/perfil";
    if (user?.tipo_usuario === "vendedor") return "/vendedor/perfil";
    return null;
  };

  const getProfileLabel = () => {
    if (user?.tipo_usuario === "autopeca") return "Minha Conta";
    return "Meu Perfil";
  };

  // Determinar o nome a ser exibido baseado no tipo de usuário
  const displayName = (() => {
    if (user?.tipo_usuario === "cliente") {
      return user?.cliente?.nome_completo || user?.perfil?.nome_completo || user?.email;
    }
    if (user?.tipo_usuario === "autopeca") {
      return user?.autopeca?.razao_social || user?.autopeca?.nome_fantasia || user?.perfil?.razao_social || user?.perfil?.nome_fantasia || user?.email;
    }
    if (user?.tipo_usuario === "vendedor") {
      return user?.vendedor?.nome_completo || user?.perfil?.nome_completo || user?.email;
    }
    // Fallback genérico
    return user?.nome_completo || user?.razao_social || user?.nome_fantasia || user?.email;
  })();

  const profilePath = getProfilePath();
  const menuButtonClass =
    "border-primary text-primary hover:bg-primary/10 hover:text-primary focus-visible:ring-primary";

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <Car className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-primary">PeçaJá</span>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-gray-600 hidden sm:inline">
                  {displayName}
                </span>
                <Link to={getDashboardPath()}>
                  <Button variant="outline" size="sm" className={menuButtonClass}>
                    Dashboard
                  </Button>
                </Link>

                {profilePath && (
                  <Link to={profilePath}>
                    <Button
                      variant="outline"
                      size="sm"
                      className={menuButtonClass}
                    >
                      {getProfileLabel()}
                    </Button>
                  </Link>
                )}
                
                {/* Links específicos por tipo de usuário */}
                {user?.tipo_usuario === "cliente" && (
                  <Link to="/solicitacoes/nova">
                    <Button size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Nova Solicitação
                    </Button>
                  </Link>
                )}
                
                {user?.tipo_usuario === "autopeca" && (
                  <Link to="/vendedores">
                    <Button
                      variant="outline"
                      size="sm"
                      className={menuButtonClass}
                    >
                      <Users className="mr-2 h-4 w-4" />
                      Vendedores
                    </Button>
                  </Link>
                )}
                
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Login
                  </Button>
                </Link>
                <Link to="/cadastrar">
                  <Button size="sm">
                    Cadastrar
                  </Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
