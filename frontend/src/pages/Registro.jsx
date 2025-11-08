import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { Button, Input, Card, CardContent, CardHeader, CardTitle } from "../components/ui";
import { Header, Footer } from "../components/layout";
import {
  validarEmail,
  validarCPF,
  validarCNPJ,
  formatarCPF,
  formatarCNPJ,
  formatarCelular,
  formatarTelefone,
  formatarCEP,
} from "../utils/validators";
import { Car, Store } from "lucide-react";
import { cn } from "../lib/utils";

const Registro = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [searchParams] = useSearchParams();
  
  // Tipo inicial baseado na query string ou padrão 'cliente'
  const initialType = searchParams.get("type") === "autopeca" ? "autopeca" : "cliente";
  const [tipoUsuario, setTipoUsuario] = useState(initialType);

  // Estado do formulário - campos comuns
  const [formData, setFormData] = useState({
    email: "",
    senha: "",
    confirmarSenha: "",
    termos_aceitos: false,
    consentimento_marketing: false,
    // Campos de cliente
    nome_completo: "",
    celular: "",
    cpf: "",
    cep: "",
    cidade: "",
    uf: "",
    // Campos de autopeça
    razao_social: "",
    nome_fantasia: "",
    cnpj: "",
    telefone: "",
    endereco_cep: "",
    endereco_rua: "",
    endereco_numero: "",
    endereco_bairro: "",
    endereco_cidade: "",
    endereco_uf: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    let formattedValue = value;

    // Formatação automática
    if (name === "cpf") {
      formattedValue = formatarCPF(value);
    } else if (name === "cnpj") {
      formattedValue = formatarCNPJ(value);
    } else if (name === "celular") {
      formattedValue = formatarCelular(value);
    } else if (name === "telefone") {
      formattedValue = formatarTelefone(value);
    } else if (name === "cep" || name === "endereco_cep") {
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

    if (formData.senha.length < 6) {
      newErrors.senha = "A senha deve ter pelo menos 6 caracteres";
    }

    if (formData.senha !== formData.confirmarSenha) {
      newErrors.confirmarSenha = "As senhas não coincidem";
    }

    if (!formData.termos_aceitos) {
      newErrors.termos_aceitos = "Você deve aceitar os termos de uso";
    }

    // Validações específicas por tipo
    if (tipoUsuario === "cliente") {
      if (!validarCPF(formData.cpf)) {
        newErrors.cpf = "CPF inválido";
      }

      const celularRegex = /^\([0-9]{2}\)[0-9]{4,5}-[0-9]{4}$/;
      if (!celularRegex.test(formData.celular)) {
        newErrors.celular = "Formato inválido. Use: (11)99999-9999";
      }

      if (formData.cep.replace(/\D/g, "").length !== 8) {
        newErrors.cep = "CEP deve ter 8 dígitos";
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
          senha: formData.senha,
          nome_completo: formData.nome_completo,
          celular: formData.celular,
          cpf: formData.cpf,
          cep: formData.cep.replace(/\D/g, ""),
          cidade: formData.cidade,
          uf: formData.uf,
          termos_aceitos: formData.termos_aceitos,
          consentimento_marketing: formData.consentimento_marketing,
        };
      } else {
        endpoint = "/auth/register-autopeca";
        payload = {
          email: formData.email,
          senha: formData.senha,
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
          consentimento_marketing: formData.consentimento_marketing,
        };
      }

      const response = await api.post(endpoint, payload);

      if (response.data.success) {
        // Fazer login automático após cadastro
        const loginResult = await login(formData.email, formData.senha);

        if (loginResult.success) {
          const dashboardPath = tipoUsuario === "cliente" ? "/dashboard/cliente" : "/dashboard/autopeca";
          navigate(dashboardPath);
        } else {
          navigate("/login");
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
            <h2 className="text-3xl font-bold mb-2">Criar Conta</h2>
            <p className="text-muted-foreground">
              Já tem uma conta?{" "}
              <Link
                to="/login"
                className="font-medium text-primary hover:text-primary/80"
              >
                Faça login
              </Link>
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
                      error={errors.email}
                    />
                  </div>

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

                  {tipoUsuario === "cliente" ? (
                    <>
                      <div>
                        <Input
                          label="CPF"
                          id="cpf"
                          name="cpf"
                          value={formData.cpf}
                          onChange={handleChange}
                          placeholder="000.000.000-00"
                          maxLength={14}
                          required
                          error={errors.cpf}
                        />
                      </div>

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
                          label="CEP"
                          id="cep"
                          name="cep"
                          value={formData.cep}
                          onChange={handleChange}
                          placeholder="00000-000"
                          maxLength={9}
                          required
                          error={errors.cep}
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
                        Aceito os termos de uso e política de privacidade
                      </label>
                      {errors.termos_aceitos && (
                        <p className="text-destructive mt-1">{errors.termos_aceitos}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="consentimento_marketing"
                        name="consentimento_marketing"
                        type="checkbox"
                        checked={formData.consentimento_marketing}
                        onChange={handleChange}
                        className="h-4 w-4 text-primary focus:ring-primary border-input rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label
                        htmlFor="consentimento_marketing"
                        className="text-muted-foreground"
                      >
                        Desejo receber ofertas e novidades por email
                      </label>
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
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Registro;



