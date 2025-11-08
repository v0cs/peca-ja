import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Header } from "../components/layout";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, LoadingSpinner } from "../components/ui";
import { VehicleForm, ImageUpload } from "../components";
import api from "../services/api";
import { Plus, ArrowLeft } from "lucide-react";

const NovaSolicitacao = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    placa: "",
    marca: "",
    modelo: "",
    ano_fabricacao: "",
    ano_modelo: "",
    categoria: "",
    cor: "",
    descricao_peca: "",
    cidade_atendimento: user?.perfil?.cidade || "",
    uf_atendimento: user?.perfil?.uf || "",
  });

  const [images, setImages] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Limpar erro do campo ao editar
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validate = () => {
    const newErrors = {};

    // Validar placa: normalizar e verificar formato
    if (!formData.placa) {
      newErrors.placa = "Placa é obrigatória";
    } else {
      // Normalizar placa (remover hífen e espaços, converter para maiúscula)
      const placaNormalizada = formData.placa.replace(/-/g, "").replace(/\s+/g, "").toUpperCase();
      
      // Validar formato: Mercosul (ABC1D23) ou Antigo (ABC1234)
      const placaRegex = /^[A-Z]{3}[0-9][0-9A-Z][0-9]{2}$|^[A-Z]{3}[0-9]{4}$/;
      
      if (placaNormalizada.length !== 7 || !placaRegex.test(placaNormalizada)) {
        newErrors.placa = "Placa inválida. Use o formato ABC-1234 ou ABC1D23 (Mercosul)";
      }
    }

    if (!formData.marca) {
      newErrors.marca = "Marca é obrigatória";
    }

    if (!formData.modelo) {
      newErrors.modelo = "Modelo é obrigatório";
    }

    if (!formData.ano_fabricacao) {
      newErrors.ano_fabricacao = "Ano de fabricação é obrigatório";
    }

    if (!formData.categoria) {
      newErrors.categoria = "Categoria é obrigatória";
    }

    if (!formData.descricao_peca || formData.descricao_peca.trim().length < 10) {
      newErrors.descricao_peca = "Descrição deve ter pelo menos 10 caracteres";
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
      // Criar FormData para suportar upload de imagens
      const formDataToSend = new FormData();

      // Adicionar campos do formulário
      // Normalizar placa: remover hífen e espaços, converter para maiúscula
      const placaNormalizada = formData.placa.replace(/-/g, "").replace(/\s+/g, "").toUpperCase();
      formDataToSend.append("placa", placaNormalizada);
      formDataToSend.append("marca", (formData.marca || "").trim());
      formDataToSend.append("modelo", (formData.modelo || "").trim());
      // FormData sempre envia como string, backend deve converter para número
      formDataToSend.append("ano_fabricacao", String(formData.ano_fabricacao || ""));
      formDataToSend.append("ano_modelo", String(formData.ano_modelo || formData.ano_fabricacao || ""));
      formDataToSend.append("categoria", formData.categoria || "");
      formDataToSend.append("cor", (formData.cor || "Não informado").trim());
      formDataToSend.append("descricao_peca", (formData.descricao_peca || "").trim());

      if (formData.cidade_atendimento) {
        formDataToSend.append("cidade_atendimento", formData.cidade_atendimento);
      }

      if (formData.uf_atendimento) {
        formDataToSend.append("uf_atendimento", formData.uf_atendimento);
      }

      // Adicionar imagens (backend espera o campo "images" em inglês)
      images.forEach((image) => {
        if (image instanceof File) {
          formDataToSend.append("images", image);
        }
      });

      // Não definir Content-Type manualmente - axios configura automaticamente com boundary
      const response = await api.post("/solicitacoes", formDataToSend);

      if (response.data.success) {
        // Redirecionar para detalhes da solicitação criada
        navigate(`/solicitacoes/${response.data.data.solicitacao.id}`);
      }
    } catch (err) {
      console.error("❌ Erro ao criar solicitação:", {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        message: err.message,
      });

      const message = err.response?.data?.message || "Erro ao criar solicitação. Tente novamente.";
      const fieldErrors = err.response?.data?.errors || {};

      if (Object.keys(fieldErrors).length > 0) {
        // Se tiver campos faltando, mostrar mensagem específica
        if (fieldErrors.campos_faltando) {
          setError(fieldErrors.message || `Campos obrigatórios: ${fieldErrors.campos_faltando.join(", ")}`);
          // Mapear campos faltando para erros individuais
          fieldErrors.campos_faltando.forEach((campo) => {
            setErrors((prev) => ({ ...prev, [campo]: `${campo} é obrigatório` }));
          });
        } else {
          setErrors(fieldErrors);
        }
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-card/50">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate("/dashboard/cliente")}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Dashboard
            </Button>
            <h1 className="text-3xl font-bold">Nova Solicitação</h1>
            <p className="text-muted-foreground mt-2">
              Crie uma solicitação de orçamento para a peça que você precisa
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Informações da Solicitação</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded">
                    {error}
                  </div>
                )}

                {/* Formulário do Veículo */}
                <VehicleForm
                  formData={formData}
                  onChange={handleChange}
                  errors={errors}
                />

                {/* Descrição da Peça */}
                <div>
                  <label htmlFor="descricao_peca" className="block text-sm font-medium mb-1">
                    Descrição da Peça <span className="text-destructive">*</span>
                  </label>
                  <textarea
                    id="descricao_peca"
                    name="descricao_peca"
                    value={formData.descricao_peca}
                    onChange={handleChange}
                    required
                    rows={4}
                    className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Descreva a peça que você precisa, incluindo detalhes como marca preferida, se é original ou compatível, etc."
                  />
                  {errors.descricao_peca && (
                    <p className="text-sm text-destructive mt-1">{errors.descricao_peca}</p>
                  )}
                </div>

                {/* Upload de Imagens */}
                <ImageUpload
                  images={images}
                  onChange={setImages}
                  maxImages={3}
                  error={errors.imagens}
                />

                {/* Localização (Opcional) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Cidade de Atendimento (opcional)"
                    id="cidade_atendimento"
                    name="cidade_atendimento"
                    value={formData.cidade_atendimento}
                    onChange={handleChange}
                    placeholder="Se deixar em branco, será usada a cidade do seu cadastro"
                    error={errors.cidade_atendimento}
                  />

                  <Input
                    label="UF (opcional)"
                    id="uf_atendimento"
                    name="uf_atendimento"
                    value={formData.uf_atendimento}
                    onChange={handleChange}
                    placeholder="SP"
                    maxLength={2}
                    error={errors.uf_atendimento}
                  />
                </div>

                {/* Botões */}
                <div className="flex gap-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/dashboard/cliente")}
                    disabled={loading}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Criando solicitação...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Criar Solicitação
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default NovaSolicitacao;
