import { useAuth } from "../contexts/AuthContext";
import { Header } from "../components/layout";
import { Button } from "../components/ui";

const DashboardVendedor = () => {
  const { user, logout } = useAuth();

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-grow bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Dashboard - Vendedor
            </h1>
            <p className="mt-2 text-gray-600">
              Bem-vindo, {user?.perfil?.nome_completo || user?.email}!
            </p>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Minha Conta</h2>
            <div className="space-y-2 text-gray-600">
              <p>
                <strong>Email:</strong> {user?.email}
              </p>
              <p>
                <strong>Tipo:</strong> Vendedor
              </p>
            </div>

            <div className="mt-6">
              <Button onClick={logout} variant="secondary">
                Sair
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardVendedor;



