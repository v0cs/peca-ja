import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import PrivateRoute from "./components/PrivateRoute";
import {
  LandingPage,
  Login,
  Registro,
  RegistroCliente,
  RegistroAutopeca,
  DashboardCliente,
  DashboardAutopeca,
  DashboardVendedor,
  PerfilCliente,
  PerfilAutopeca,
  PerfilVendedor,
  NovaSolicitacao,
  DetalheSolicitacao,
  EditarSolicitacao,
  GerenciarVendedores,
  RecuperarSenha,
  ResetPassword,
} from "./pages";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Rotas públicas */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/recuperar-senha" element={<RecuperarSenha />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/cadastrar" element={<Registro />} />
          {/* Rotas antigas mantidas para compatibilidade */}
          <Route path="/cadastrar/cliente" element={<RegistroCliente />} />
          <Route path="/cadastrar/autopeca-old" element={<RegistroAutopeca />} />

          {/* Rotas protegidas - Dashboards */}
          <Route
            path="/dashboard/cliente"
            element={
              <PrivateRoute tipoUsuario="cliente">
                <DashboardCliente />
              </PrivateRoute>
            }
          />
          <Route
            path="/dashboard/autopeca"
            element={
              <PrivateRoute tipoUsuario="autopeca">
                <DashboardAutopeca />
              </PrivateRoute>
            }
          />
          <Route
            path="/cliente/perfil"
            element={
              <PrivateRoute tipoUsuario="cliente">
                <PerfilCliente />
              </PrivateRoute>
            }
          />
          <Route
            path="/autopeca/perfil"
            element={
              <PrivateRoute tipoUsuario="autopeca">
                <PerfilAutopeca />
              </PrivateRoute>
            }
          />
          <Route
            path="/vendedor/perfil"
            element={
              <PrivateRoute tipoUsuario="vendedor">
                <PerfilVendedor />
              </PrivateRoute>
            }
          />
          <Route
            path="/vendedor/dashboard"
            element={
              <PrivateRoute tipoUsuario="vendedor">
                <DashboardVendedor />
              </PrivateRoute>
            }
          />
          {/* Rota legada para compatibilidade */}
          <Route
            path="/dashboard/vendedor"
            element={<Navigate to="/vendedor/dashboard" replace />}
          />

          {/* Rotas protegidas - Cliente */}
          <Route
            path="/solicitacoes/nova"
            element={
              <PrivateRoute tipoUsuario="cliente">
                <NovaSolicitacao />
              </PrivateRoute>
            }
          />
          <Route
            path="/solicitacoes/:id"
            element={
              <PrivateRoute tipoUsuario={["cliente", "autopeca", "vendedor"]}>
                <DetalheSolicitacao />
              </PrivateRoute>
            }
          />
          <Route
            path="/solicitacoes/:id/editar"
            element={
              <PrivateRoute tipoUsuario="cliente">
                <EditarSolicitacao />
              </PrivateRoute>
            }
          />

          {/* Rotas protegidas - Autopeça */}
          <Route
            path="/vendedores"
            element={
              <PrivateRoute tipoUsuario="autopeca">
                <GerenciarVendedores />
              </PrivateRoute>
            }
          />
          
          {/* Rota padrão - redireciona para home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
