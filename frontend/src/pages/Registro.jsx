import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { Button, Input, Card, CardContent, CardHeader, CardTitle } from "../components/ui";
import { Header, Footer } from "../components/layout";
import {
  validarEmail,
  validarCNPJ,
  formatarCNPJ,
  formatarCelular,
  formatarTelefone,
  formatarCEP,
} from "../utils/validators";
import { Car, Store } from "lucide-react";
import { cn } from "../lib/utils";

const Registro = () => {
  const navigate = useNavigate();
  const { login, updateUser } = useAuth();
  const [searchParams] = useSearchParams();
  
  // Verificar se veio do OAuth
  const isOAuth = searchParams.get("novoUsuario") === "true";
  const contaExcluida = searchParams.get("contaExcluida") === "true";
  const oauthEmail = searchParams.get("email") || "";
  const oauthName = searchParams.get("name") || "";
  const oauthGoogleId = searchParams.get("googleId") || "";
  const oauthPicture = searchParams.get("picture") || "";
  
  // Tipo inicial baseado na query string ou padrão 'cliente'
  const initialType = searchParams.get("type") === "autopeca" ? "autopeca" : "cliente";
  const [tipoUsuario, setTipoUsuario] = useState(initialType);

  // Estado do formulário - campos comuns
  const [formData, setFormData] = useState({
    email: isOAuth ? oauthEmail : "",
    senha: "",
    confirmarSenha: "",
    termos_aceitos: false,
    // Campos de cliente
    nome_completo: isOAuth ? oauthName : "",
    celular: "",
    cidade: "",
    uf: "",
    // Campos de autopeça
    razao_social: isOAuth ? oauthName : "",
    nome_fantasia: "",
    cnpj: "",
    telefone: "",
    endereco_cep: "",
    endereco_rua: "",
    endereco_numero: "",
    endereco_bairro: "",
    endereco_cidade: "",
    endereco_uf: "",
    // Campos OAuth
    google_id: oauthGoogleId,
    picture: oauthPicture,
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Atualizar estado do formulário quando os parâmetros OAuth mudarem
  useEffect(() => {
    if (isOAuth && oauthEmail) {
      setFormData((prev) => ({
        ...prev,
        email: oauthEmail,
        nome_completo: tipoUsuario === "cliente" ? oauthName : prev.nome_completo,
        razao_social: tipoUsuario === "autopeca" ? oauthName : prev.razao_social,
        google_id: oauthGoogleId,
        picture: oauthPicture,
      }));
    }
  }, [isOAuth, oauthEmail, oauthName, oauthGoogleId, oauthPicture, tipoUsuario]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    let formattedValue = value;

    // Formatação automática
    if (name === "cnpj") {
      formattedValue = formatarCNPJ(value);
    } else if (name === "celular") {
      formattedValue = formatarCelular(value);
    } else if (name === "telefone") {
      formattedValue = formatarTelefone(value);
    } else if (name === "endereco_cep") {
      formattedValue = formatarCEP(value);
    } else if (name === "uf" || name === "endereco_uf") {
      formattedValue = value.toUpperCase().slice(0, 2);
    }

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : formattedValue,
    }));

    // Limpar erro do campo ao editar
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validate = () => {
    const newErrors = {};

    // Validações comuns
    if (!validarEmail(formData.email)) {
      newErrors.email = "Email inválido";
    }

    // Senha só é obrigatória se NÃO for OAuth
    if (!isOAuth) {
    if (formData.senha.length < 6) {
      newErrors.senha = "A senha deve ter pelo menos 6 caracteres";
    }

    if (formData.senha !== formData.confirmarSenha) {
      newErrors.confirmarSenha = "As senhas não coincidem";
      }
    }

    if (!formData.termos_aceitos) {
      newErrors.termos_aceitos = "Você deve aceitar os termos de uso";
    }

    // Validações específicas por tipo
    if (tipoUsuario === "cliente") {
      const celularRegex = /^\([0-9]{2}\)[0-9]{4,5}-[0-9]{4}$/;
      if (!celularRegex.test(formData.celular)) {
        newErrors.celular = "Formato inválido. Use: (11)99999-9999";
      }

      if (!formData.nome_completo.trim()) {
        newErrors.nome_completo = "Nome completo é obrigatório";
      }

      if (!formData.cidade.trim()) {
        newErrors.cidade = "Cidade é obrigatória";
      }

      if (!formData.uf || formData.uf.trim().length !== 2) {
        newErrors.uf = "UF deve ter 2 caracteres";
      }
    } else {
      // Autopeça
      if (!validarCNPJ(formData.cnpj)) {
        newErrors.cnpj = "CNPJ inválido";
      }

      const telefoneRegex = /^\([0-9]{2}\)[0-9]{4}-[0-9]{4}$/;
      if (!telefoneRegex.test(formData.telefone)) {
        newErrors.telefone = "Formato inválido. Use: (11)3333-4444";
      }

      if (formData.endereco_cep.replace(/\D/g, "").length !== 8) {
        newErrors.endereco_cep = "CEP deve ter 8 dígitos";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!validate()) {
      return;
    }

    setLoading(true);

    try {
      let payload;
      let endpoint;

      if (tipoUsuario === "cliente") {
        endpoint = "/auth/register";
        payload = {
          email: formData.email,
          nome_completo: formData.nome_completo,
          celular: formData.celular,
          cidade: formData.cidade,
          uf: formData.uf,
          termos_aceitos: formData.termos_aceitos,
        };
        
        // Adicionar senha ou google_id conforme o caso
        if (isOAuth && formData.google_id) {
          payload.google_id = formData.google_id;
        } else {
          payload.senha = formData.senha;
        }
      } else {
        endpoint = "/auth/register-autopeca";
        payload = {
          email: formData.email,
          razao_social: formData.razao_social,
          nome_fantasia: formData.nome_fantasia || undefined,
          cnpj: formData.cnpj.replace(/\D/g, ""), // Remove formatação: apenas números
          telefone: formData.telefone,
          endereco_cep: formData.endereco_cep.replace(/\D/g, ""),
          endereco_rua: formData.endereco_rua,
          endereco_numero: formData.endereco_numero,
          endereco_bairro: formData.endereco_bairro,
          endereco_cidade: formData.endereco_cidade,
          endereco_uf: formData.endereco_uf,
          termos_aceitos: formData.termos_aceitos,
        };
        
        // Adicionar senha ou google_id conforme o caso
        if (isOAuth && formData.google_id) {
          payload.google_id = formData.google_id;
        } else {
          payload.senha = formData.senha;
        }
      }

      const response = await api.post(endpoint, payload);

      if (response.data.success) {
        // Se for OAuth, o backend já retornou o token
        if (isOAuth && response.data.token) {
          // Salvar token e dados do usuário
          localStorage.setItem("token", response.data.token);
          if (response.data.user) {
            localStorage.setItem("user", JSON.stringify(response.data.user));
            updateUser(response.data.user, response.data.token);
          }
          
          // Redirecionar baseado no tipo de usuário
          const userType = response.data.user?.tipo_usuario || tipoUsuario;
          if (userType === "cliente") {
            navigate("/dashboard/cliente");
          } else {
            navigate("/dashboard/autopeca");
          }
        } else {
          // Fazer login automático após cadastro (não OAuth)
        const loginResult = await login(formData.email, formData.senha);

        if (loginResult.success) {
          // Usar o tipo_usuario retornado pelo backend ao invés da variável do formulário
          // Isso garante que o redirecionamento seja baseado no tipo real do usuário no banco
          const userType = loginResult.user?.tipo_usuario || tipoUsuario;
          const dashboardPath = userType === "cliente" ? "/dashboard/cliente" : "/dashboard/autopeca";
          navigate(dashboardPath);
        } else {
          navigate("/login");
          }
        }
      }
    } catch (err) {
      const message =
        err.response?.data?.message || "Erro ao criar conta. Tente novamente.";
      const fieldErrors = err.response?.data?.errors || {};

      if (Object.keys(fieldErrors).length > 0) {
        setErrors(fieldErrors);
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background to-card/50">
      <Header />

      <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold mb-2">
              {isOAuth ? "Complete seu Cadastro" : "Criar Conta"}
            </h2>
            {isOAuth && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  {contaExcluida
                    ? "Sua conta anterior foi excluída. Complete os dados abaixo para criar uma nova conta."
                    : "Você iniciou o cadastro com Google. Complete os dados abaixo para finalizar."}
                </p>
              </div>
            )}
            <p className="text-muted-foreground">
              {isOAuth ? (
                <>
                  Deseja fazer login?{" "}
                  <Link
                    to="/login"
                    className="font-medium text-primary hover:text-primary/80"
                  >
                    Ir para login
                  </Link>
                </>
              ) : (
                <>
              Já tem uma conta?{" "}
              <Link
                to="/login"
                className="font-medium text-primary hover:text-primary/80"
              >
                Faça login
              </Link>
                </>
              )}
            </p>
          </div>

          {/* Seletor de Tipo */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setTipoUsuario("cliente")}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-3 p-4 rounded-lg border-2 transition-all",
                    tipoUsuario === "cliente"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <Car className={cn(
                    "h-5 w-5",
                    tipoUsuario === "cliente" ? "text-primary" : "text-muted-foreground"
                  )} />
                  <span className={cn(
                    "font-medium",
                    tipoUsuario === "cliente" ? "text-primary" : "text-muted-foreground"
                  )}>
                    Sou Cliente
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setTipoUsuario("autopeca")}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-3 p-4 rounded-lg border-2 transition-all",
                    tipoUsuario === "autopeca"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <Store className={cn(
                    "h-5 w-5",
                    tipoUsuario === "autopeca" ? "text-primary" : "text-muted-foreground"
                  )} />
                  <span className={cn(
                    "font-medium",
                    tipoUsuario === "autopeca" ? "text-primary" : "text-muted-foreground"
                  )}>
                    Sou Autopeça
                  </span>
                </button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                {tipoUsuario === "cliente" ? "Cadastro de Cliente" : "Cadastro de Autopeça"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded">
                    {error}
                  </div>
                )}

                {/* Campos Comuns */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {tipoUsuario === "cliente" ? (
                    <div className="md:col-span-2">
                      <Input
                        label="Nome Completo"
                        id="nome_completo"
                        name="nome_completo"
                        value={formData.nome_completo}
                        onChange={handleChange}
                        required
                        error={errors.nome_completo}
                      />
                    </div>
                  ) : (
                    <>
                      <div className="md:col-span-2">
                        <Input
                          label="Razão Social"
                          id="razao_social"
                          name="razao_social"
                          value={formData.razao_social}
                          onChange={handleChange}
                          required
                          error={errors.razao_social}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Input
                          label="Nome Fantasia (opcional)"
                          id="nome_fantasia"
                          name="nome_fantasia"
                          value={formData.nome_fantasia}
                          onChange={handleChange}
                          error={errors.nome_fantasia}
                        />
                      </div>
                    </>
                  )}

                  <div className="md:col-span-2">
                    <Input
                      label="Email"
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder={tipoUsuario === "cliente" ? "seu@email.com" : "contato@autopeca.com"}
                      required
                      disabled={isOAuth}
                      error={errors.email}
                    />
                    {isOAuth && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Email vinculado à sua conta Google
                      </p>
                    )}
                  </div>

                  {!isOAuth && (
                    <>
                  <div>
                    <Input
                      label="Senha"
                      id="senha"
                      name="senha"
                      type="password"
                      value={formData.senha}
                      onChange={handleChange}
                      required
                      error={errors.senha}
                    />
                  </div>

                  <div>
                    <Input
                      label="Confirmar Senha"
                      id="confirmarSenha"
                      name="confirmarSenha"
                      type="password"
                      value={formData.confirmarSenha}
                      onChange={handleChange}
                      required
                      error={errors.confirmarSenha}
                    />
                  </div>
                    </>
                  )}
                  {isOAuth && (
                    <div className="md:col-span-2 p-3 bg-muted/50 rounded-lg border border-border">
                      <p className="text-sm text-muted-foreground">
                        <strong>Autenticação via Google:</strong> Você não precisa criar uma senha. Sua conta será protegida pela autenticação do Google.
                      </p>
                    </div>
                  )}

                  {tipoUsuario === "cliente" ? (
                    <>
                      <div>
                        <Input
                          label="Celular"
                          id="celular"
                          name="celular"
                          value={formData.celular}
                          onChange={handleChange}
                          placeholder="(11)99999-9999"
                          maxLength={15}
                          required
                          error={errors.celular}
                        />
                      </div>
                      <div>
                        <Input
                          label="Cidade"
                          id="cidade"
                          name="cidade"
                          value={formData.cidade}
                          onChange={handleChange}
                          required
                          error={errors.cidade}
                        />
                      </div>
                      <div>
                        <Input
                          label="UF"
                          id="uf"
                          name="uf"
                          value={formData.uf}
                          onChange={handleChange}
                          placeholder="SP"
                          maxLength={2}
                          required
                          error={errors.uf}
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <Input
                          label="CNPJ"
                          id="cnpj"
                          name="cnpj"
                          value={formData.cnpj}
                          onChange={handleChange}
                          placeholder="12.345.678/0001-90"
                          maxLength={18}
                          required
                          error={errors.cnpj}
                        />
                      </div>

                      <div>
                        <Input
                          label="Telefone"
                          id="telefone"
                          name="telefone"
                          value={formData.telefone}
                          onChange={handleChange}
                          placeholder="(11)3333-4444"
                          maxLength={14}
                          required
                          error={errors.telefone}
                        />
                      </div>

                      <div>
                        <Input
                          label="CEP"
                          id="endereco_cep"
                          name="endereco_cep"
                          value={formData.endereco_cep}
                          onChange={handleChange}
                          placeholder="00000-000"
                          maxLength={9}
                          required
                          error={errors.endereco_cep}
                        />
                      </div>

                      <div>
                        <Input
                          label="Cidade"
                          id="endereco_cidade"
                          name="endereco_cidade"
                          value={formData.endereco_cidade}
                          onChange={handleChange}
                          required
                          error={errors.endereco_cidade}
                        />
                      </div>

                      <div>
                        <Input
                          label="UF"
                          id="endereco_uf"
                          name="endereco_uf"
                          value={formData.endereco_uf}
                          onChange={handleChange}
                          placeholder="SP"
                          maxLength={2}
                          required
                          error={errors.endereco_uf}
                        />
                      </div>

                      <div className="md:col-span-2">
                        <Input
                          label="Rua"
                          id="endereco_rua"
                          name="endereco_rua"
                          value={formData.endereco_rua}
                          onChange={handleChange}
                          required
                          error={errors.endereco_rua}
                        />
                      </div>

                      <div>
                        <Input
                          label="Número"
                          id="endereco_numero"
                          name="endereco_numero"
                          value={formData.endereco_numero}
                          onChange={handleChange}
                          required
                          error={errors.endereco_numero}
                        />
                      </div>

                      <div>
                        <Input
                          label="Bairro"
                          id="endereco_bairro"
                          name="endereco_bairro"
                          value={formData.endereco_bairro}
                          onChange={handleChange}
                          required
                          error={errors.endereco_bairro}
                        />
                      </div>
                    </>
                  )}
                </div>

                {/* Checkboxes */}
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="termos_aceitos"
                        name="termos_aceitos"
                        type="checkbox"
                        checked={formData.termos_aceitos}
                        onChange={handleChange}
                        className="h-4 w-4 text-primary focus:ring-primary border-input rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label
                        htmlFor="termos_aceitos"
                        className="font-medium"
                      >
                        Aceito os{" "}
                        <Link
                          to="/politica-privacidade"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:text-primary/80 underline"
                        >
                          termos de uso e política de privacidade
                        </Link>
                      </label>
                      {errors.termos_aceitos && (
                        <p className="text-destructive mt-1">{errors.termos_aceitos}</p>
                      )}
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
                    {loading ? "Criando conta..." : "Criar Conta"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Botão Google OAuth - apenas se não for OAuth */}
          {!isOAuth && (
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">
                    OU
                  </span>
                </div>
              </div>

              <Button
                variant="outline"
                size="lg"
                className="w-full flex items-center justify-center gap-2 mt-4"
                onClick={() => {
                  const apiURL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";
                  window.location.href = `${apiURL}/auth/google`;
                }}
                disabled={loading}
              >
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Cadastrar com Google
              </Button>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Registro;



