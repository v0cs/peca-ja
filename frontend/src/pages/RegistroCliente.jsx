import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { Button, Input } from "../components/ui";
import { Header, Footer } from "../components/layout";
import {
  validarEmail,
  validarCPF,
  formatarCPF,
  formatarCelular,
  formatarCEP,
} from "../utils/validators";

const RegistroCliente = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    senha: "",
    confirmarSenha: "",
    nome_completo: "",
    celular: "",
    cpf: "",
    cep: "",
    cidade: "",
    uf: "",
    termos_aceitos: false,
    consentimento_marketing: false,
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
    } else if (name === "celular") {
      formattedValue = formatarCelular(value);
    } else if (name === "cep") {
      formattedValue = formatarCEP(value);
    } else if (name === "uf") {
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
        nome_completo: formData.nome_completo,
        celular: formData.celular,
        cpf: formData.cpf,
        cep: formData.cep.replace(/\D/g, ""),
        cidade: formData.cidade,
        uf: formData.uf,
        termos_aceitos: formData.termos_aceitos,
        consentimento_marketing: formData.consentimento_marketing,
      };

      const response = await api.post("/auth/register", payload);

      if (response.data.success) {
        // Fazer login automático após cadastro
        const loginResult = await login(formData.email, formData.senha);

        if (loginResult.success) {
          navigate("/dashboard/cliente");
        } else {
          // Se login falhar, redirecionar para login
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
              Criar conta de Cliente
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
                  label="Nome Completo"
                  id="nome_completo"
                  name="nome_completo"
                  value={formData.nome_completo}
                  onChange={handleChange}
                  required
                  error={errors.nome_completo}
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
                  placeholder="seu@email.com"
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

              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="consentimento_marketing"
                    name="consentimento_marketing"
                    type="checkbox"
                    checked={formData.consentimento_marketing}
                    onChange={handleChange}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label
                    htmlFor="consentimento_marketing"
                    className="text-gray-600"
                  >
                    Desejo receber ofertas e novidades por email
                  </label>
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

export default RegistroCliente;
