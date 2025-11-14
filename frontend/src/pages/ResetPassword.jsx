import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Header, Footer } from "../components/layout";
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from "../components/ui";
import api from "../services/api";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [formData, setFormData] = useState({
    nova_senha: "",
    confirmar_senha: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Verificar se o token está presente
    if (!token) {
      setError("Token inválido ou ausente. Solicite um novo link de recuperação.");
    }
  }, [token]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Limpar erros quando o usuário começar a digitar
    if (error) {
      setError("");
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.nova_senha) {
      errors.nova_senha = "Nova senha é obrigatória";
    } else if (formData.nova_senha.length < 6) {
      errors.nova_senha = "A senha deve ter pelo menos 6 caracteres";
    }

    if (!formData.confirmar_senha) {
      errors.confirmar_senha = "Confirmação de senha é obrigatória";
    } else if (formData.nova_senha !== formData.confirmar_senha) {
      errors.confirmar_senha = "As senhas não coincidem";
    }

    return errors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!token) {
      setError("Token inválido ou ausente. Solicite um novo link de recuperação.");
      return;
    }

    // Validar formulário
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setError(
        Object.values(errors)[0] || "Por favor, corrija os erros no formulário."
      );
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/auth/reset-password", {
        token,
        nova_senha: formData.nova_senha,
      });

      if (response.data.success) {
        setSuccess(true);
        // Redirecionar para login após 3 segundos
        setTimeout(() => {
          navigate("/login", {
            state: {
              message: "Senha redefinida com sucesso! Faça login com sua nova senha.",
            },
          });
        }, 3000);
      }
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.errors?.token ||
        err.response?.data?.errors?.nova_senha ||
        "Não foi possível redefinir a senha. Verifique o token ou tente novamente.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="flex min-h-screen flex-col bg-gradient-to-br from-background to-card/50">
        <Header />

        <main className="flex-grow px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-md">
            <Card>
              <CardContent className="pt-6">
                <div className="rounded border border-destructive/20 bg-destructive/10 px-4 py-3 text-destructive text-center">
                  Token inválido ou ausente. Por favor, solicite um novo link de recuperação.
                </div>
                <div className="mt-4 text-center">
                  <Link to="/recuperar-senha">
                    <Button variant="outline">Solicitar novo link</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex min-h-screen flex-col bg-gradient-to-br from-background to-card/50">
        <Header />

        <main className="flex-grow px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-md">
            <Card>
              <CardContent className="pt-6">
                <div className="rounded border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-700 text-center">
                  <p className="font-semibold">Senha redefinida com sucesso!</p>
                  <p className="mt-2 text-sm">
                    Você será redirecionado para a página de login em alguns segundos...
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-background to-card/50">
      <Header />

      <main className="flex-grow px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-md">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold mb-2">Redefinir senha</h2>
            <p className="text-muted-foreground">
              Digite sua nova senha abaixo. Ela deve ter pelo menos 6 caracteres.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Nova senha</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="rounded border border-destructive/20 bg-destructive/10 px-4 py-3 text-destructive">
                    {error}
                  </div>
                )}

                <Input
                  id="nova_senha"
                  name="nova_senha"
                  type="password"
                  label="Nova senha"
                  placeholder="••••••••"
                  value={formData.nova_senha}
                  onChange={handleChange}
                  required
                  autoComplete="new-password"
                />

                <Input
                  id="confirmar_senha"
                  name="confirmar_senha"
                  type="password"
                  label="Confirmar nova senha"
                  placeholder="••••••••"
                  value={formData.confirmar_senha}
                  onChange={handleChange}
                  required
                  autoComplete="new-password"
                />

                <Button type="submit" size="lg" className="w-full" disabled={loading}>
                  {loading ? "Redefinindo..." : "Redefinir senha"}
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  Lembrou a senha?{" "}
                  <Link className="font-medium text-primary hover:text-primary/80" to="/login">
                    Voltar para o login
                  </Link>
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ResetPassword;

