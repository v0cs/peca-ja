import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { Button, Input } from "../components/ui";
import { Header, Footer } from "../components/layout";
import {
  validarEmail,
  validarCNPJ,
  formatarCNPJ,
  formatarTelefone,
  formatarCEP,
} from "../utils/validators";

const RegistroAutopeca = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    senha: "",
    confirmarSenha: "",
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
    termos_aceitos: false,
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    let formattedValue = value;

    // Formatação automática
    if (name === "cnpj") {
      formattedValue = formatarCNPJ(value);
    } else if (name === "telefone") {
      formattedValue = formatarTelefone(value);
    } else if (name === "endereco_cep") {
      formattedValue = formatarCEP(value);
    } else if (name === "endereco_uf") {
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

    if (!validarEmail(formData.email)) {
      newErrors.email = "Email inválido";
    }

    if (formData.senha.length < 6) {
      newErrors.senha = "A senha deve ter pelo menos 6 caracteres";
    }

    if (formData.senha !== formData.confirmarSenha) {
      newErrors.confirmarSenha = "As senhas não coincidem";
    }

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

    if (!formData.termos_aceitos) {
      newErrors.termos_aceitos = "Você deve aceitar os termos de uso";
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
      const payload = {
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
      };

      const response = await api.post("/auth/register-autopeca", payload);

      if (response.data.success) {
        // Fazer login automático após cadastro
        const loginResult = await login(formData.email, formData.senha);

        if (loginResult.success) {
          navigate("/dashboard/autopeca");
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
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-grow bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h2 className="text-3xl font-extrabold text-gray-900 text-center">
              Criar conta de Autopeça
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Já tem uma conta?{" "}
              <Link
                to="/login"
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                Faça login
              </Link>
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="bg-white shadow-md rounded-lg px-8 pt-6 pb-8 space-y-6"
          >
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  label="Nome Fantasia"
                  id="nome_fantasia"
                  name="nome_fantasia"
                  value={formData.nome_fantasia}
                  onChange={handleChange}
                  error={errors.nome_fantasia}
                />
              </div>

              <div className="md:col-span-2">
                <Input
                  label="Email"
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="contato@autopeca.com"
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
            </div>

            <div className="space-y-4">
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="termos_aceitos"
                    name="termos_aceitos"
                    type="checkbox"
                    checked={formData.termos_aceitos}
                    onChange={handleChange}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label
                    htmlFor="termos_aceitos"
                    className="font-medium text-gray-700"
                  >
                    Aceito os termos de uso e política de privacidade
                  </label>
                  {errors.termos_aceitos && (
                    <p className="text-red-600 mt-1">{errors.termos_aceitos}</p>
                  )}
                </div>
              </div>

            </div>

            <div>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                disabled={loading}
              >
                {loading ? "Criando conta..." : "Criar Conta"}
              </Button>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default RegistroAutopeca;
