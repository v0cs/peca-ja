import { useState } from "react";
import { Link } from "react-router-dom";
import { Header, Footer } from "../components/layout";
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from "../components/ui";
import api from "../services/api";

const RecuperarSenha = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!email.trim()) {
      setError("Informe o seu email.");
      return;
    }

    // Validar formato do email
    if (!validateEmail(email.trim())) {
      setError("Por favor, informe um email válido.");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/auth/forgot-password", {
        email,
      });

      setSuccess(
        response.data?.message ||
          "Se o email estiver cadastrado, enviaremos instruções para redefinir sua senha."
      );
    } catch (err) {
      const message =
        err.response?.data?.message ||
        "Não foi possível enviar o email de recuperação. Tente novamente.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-background to-card/50">
      <Header />

      <main className="flex-grow px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-md">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold mb-2">Recuperar senha</h2>
            <p className="text-muted-foreground">
              Informe seu email e enviaremos instruções para redefinir a senha.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Esqueci minha senha</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="rounded border border-destructive/20 bg-destructive/10 px-4 py-3 text-destructive">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="rounded border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-700">
                    {success}
                  </div>
                )}

                <Input
                  id="email"
                  name="email"
                  type="email"
                  label="Email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  autoComplete="email"
                />

                <Button type="submit" size="lg" className="w-full" disabled={loading}>
                  {loading ? "Enviando..." : "Enviar link de recuperação"}
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

export default RecuperarSenha;




