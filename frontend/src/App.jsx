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
  NovaSolicitacao,
  DetalheSolicitacao,
  EditarSolicitacao,
  GerenciarVendedores,
} from "./pages";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Rotas públicas */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
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
            path="/dashboard/vendedor"
            element={
              <PrivateRoute tipoUsuario="vendedor">
                <DashboardVendedor />
              </PrivateRoute>
            }
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
              <PrivateRoute tipoUsuario={["cliente", "autopeca"]}>
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
