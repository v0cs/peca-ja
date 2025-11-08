import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Button, Input, Card, CardContent, CardHeader, CardTitle } from "../components/ui";
import { Header, Footer } from "../components/layout";
import { LogIn } from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await login(email, senha);

      if (result.success) {
        // Redirecionar baseado no tipo de usuário
        const tipoUsuario = result.user.tipo_usuario;

        if (tipoUsuario === "cliente") {
          navigate("/dashboard/cliente");
        } else if (tipoUsuario === "autopeca") {
          navigate("/dashboard/autopeca");
        } else if (tipoUsuario === "vendedor") {
          navigate("/dashboard/vendedor");
        } else {
          navigate("/");
        }
      } else {
        setError(result.message || "Erro ao fazer login");
      }
    } catch (err) {
      setError("Erro inesperado ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background to-card/50">
      <Header />

      <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold mb-2">Entre na sua conta</h2>
            <p className="text-muted-foreground">
              Não tem uma conta?{" "}
              <Link
                to="/cadastrar"
                className="font-medium text-primary hover:text-primary/80"
              >
                Criar nova conta
              </Link>
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LogIn className="h-5 w-5" />
                Login
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded">
                    {error}
                  </div>
                )}

                <div className="space-y-4">
                  <Input
                    label="Email"
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    error={error && !email ? "Campo obrigatório" : ""}
                  />

                  <div>
                    <Input
                      label="Senha"
                      id="senha"
                      name="senha"
                      type="password"
                      autoComplete="current-password"
                      required
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      placeholder="••••••••"
                      error={error && !senha ? "Campo obrigatório" : ""}
                    />
                    <div className="mt-2 text-sm text-right">
                      <Link
                        to="/recuperar-senha"
                        className="font-medium text-primary hover:text-primary/80"
                      >
                        Esqueceu sua senha?
                      </Link>
                    </div>
                  </div>
                </div>

                <div>
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full"
                    disabled={loading}
                  >
                    {loading ? "Entrando..." : "Entrar"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Login;
