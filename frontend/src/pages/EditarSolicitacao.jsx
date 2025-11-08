import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Header } from "../components/layout";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, LoadingSpinner } from "../components/ui";
import { ImageUpload, VehicleForm } from "../components";
import { useSolicitacao } from "../hooks";
import { ArrowLeft, Save, X } from "lucide-react";

const EditarSolicitacao = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { solicitacao, loading, error, atualizarSolicitacao } = useSolicitacao(id);

  const [formData, setFormData] = useState({
    marca: "",
    modelo: "",
    ano_fabricacao: "",
    ano_modelo: "",
    categoria: "",
    cor: "",
    descricao_peca: "",
    cidade_atendimento: "",
    uf_atendimento: "",
  });

  const [images, setImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [imagesToDelete, setImagesToDelete] = useState([]); // IDs das imagens a serem excluídas
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Preencher formulário quando solicitação carregar
  useEffect(() => {
    if (solicitacao) {
      setFormData({
        marca: solicitacao.marca || "",
        modelo: solicitacao.modelo || "",
        ano_fabricacao: solicitacao.ano_fabricacao || "",
        ano_modelo: solicitacao.ano_modelo || "",
        categoria: solicitacao.categoria || "",
        cor: solicitacao.cor || "",
        descricao_peca: solicitacao.descricao_peca || "",
        cidade_atendimento: solicitacao.cidade_atendimento || "",
        uf_atendimento: solicitacao.uf_atendimento || "",
      });

      // Separar imagens existentes das novas
      if (solicitacao.imagens && solicitacao.imagens.length > 0) {
        setExistingImages(solicitacao.imagens);
      }
    }
  }, [solicitacao]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.marca) {
      newErrors.marca = "Marca é obrigatória";
    }

    if (!formData.modelo) {
      newErrors.modelo = "Modelo é obrigatório";
    }

    if (!formData.categoria) {
      newErrors.categoria = "Categoria é obrigatória";
    }

    if (!formData.descricao_peca || formData.descricao_peca.trim().length < 10) {
      newErrors.descricao_peca = "Descrição deve ter pelo menos 10 caracteres";
    }

    // Validar limite de imagens (considerando imagens que serão excluídas)
    const remainingExistingImages = existingImages.filter(
      (img) => !imagesToDelete.includes(img.id)
    ).length;
    const totalImages = remainingExistingImages + images.length;
    if (totalImages > 3) {
      newErrors.imagens = `Máximo de 3 imagens permitidas. Você tem ${totalImages} imagens.`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaveError("");

    if (!validate()) {
      return;
    }

    setSaving(true);

    try {
      // Preparar dados para atualização
      const dataToSend = {
        marca: formData.marca,
        modelo: formData.modelo,
        ano_fabricacao: formData.ano_fabricacao,
        ano_modelo: formData.ano_modelo || formData.ano_fabricacao,
        categoria: formData.categoria,
        cor: formData.cor,
        descricao_peca: formData.descricao_peca,
      };

      if (formData.cidade_atendimento) {
        dataToSend.cidade_atendimento = formData.cidade_atendimento;
      }

      if (formData.uf_atendimento) {
        dataToSend.uf_atendimento = formData.uf_atendimento;
      }

      // Adicionar IDs de imagens para deletar
      if (imagesToDelete.length > 0) {
        dataToSend.imagens_para_deletar = imagesToDelete;
      }

      // Se houver novas imagens ou imagens para deletar, usar FormData
      if (images.length > 0 || imagesToDelete.length > 0) {
        const formDataToSend = new FormData();

        // Adicionar dados JSON
        Object.keys(dataToSend).forEach((key) => {
          if (key === "imagens_para_deletar") {
            // Array precisa ser enviado como JSON string
            formDataToSend.append(key, JSON.stringify(dataToSend[key]));
          } else {
            formDataToSend.append(key, dataToSend[key]);
          }
        });

        // Adicionar novas imagens
        images.forEach((image) => {
          if (image instanceof File) {
            formDataToSend.append("images", image); // Backend espera "images"
          }
        });

        // Atualizar usando FormData
        const result = await atualizarSolicitacao(formDataToSend);
        
        if (result.success) {
          navigate(`/solicitacoes/${id}`);
        } else {
          setSaveError(result.message || "Erro ao atualizar solicitação");
          if (result.errors) {
            setErrors(result.errors);
          }
        }
      } else {
        // Apenas atualizar campos JSON
        const result = await atualizarSolicitacao(dataToSend);
        
        if (result.success) {
          navigate(`/solicitacoes/${id}`);
        } else {
          setSaveError(result.message || "Erro ao atualizar solicitação");
          if (result.errors) {
            setErrors(result.errors);
          }
        }
      }
    } catch (err) {
      const message = err.response?.data?.message || "Erro ao atualizar solicitação";
      setSaveError(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-card/50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center min-h-[60vh]">
            <LoadingSpinner size="lg" />
          </div>
        </main>
      </div>
    );
  }

  if (error || !solicitacao) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-card/50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-destructive mb-4">{error || "Solicitação não encontrada"}</p>
              <Button onClick={() => navigate("/dashboard/cliente")}>
                Voltar para Dashboard
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (solicitacao.status_cliente !== "ativa") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-card/50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="mb-4">Esta solicitação não pode ser editada pois não está ativa.</p>
              <Button onClick={() => navigate(`/solicitacoes/${id}`)}>
                Ver Detalhes
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // Combinar imagens existentes com novas para preview
  const allImages = [...existingImages, ...images];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-card/50">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate(`/solicitacoes/${id}`)}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Detalhes
            </Button>
            <h1 className="text-3xl font-bold">Editar Solicitação</h1>
            <p className="text-muted-foreground mt-2">
              ID: {id} - Placa: {solicitacao.placa} (não pode ser alterada)
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Editar Informações</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {saveError && (
                  <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded">
                    {saveError}
                  </div>
                )}

                {/* Campos do Veículo (sem placa, que não pode ser editada) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Marca"
                    id="marca"
                    name="marca"
                    value={formData.marca}
                    onChange={handleChange}
                    required
                    error={errors.marca}
                  />

                  <Input
                    label="Modelo"
                    id="modelo"
                    name="modelo"
                    value={formData.modelo}
                    onChange={handleChange}
                    required
                    error={errors.modelo}
                  />

                  <Input
                    label="Ano de Fabricação"
                    id="ano_fabricacao"
                    name="ano_fabricacao"
                    type="number"
                    value={formData.ano_fabricacao}
                    onChange={handleChange}
                    required
                    error={errors.ano_fabricacao}
                  />

                  <Input
                    label="Ano do Modelo"
                    id="ano_modelo"
                    name="ano_modelo"
                    type="number"
                    value={formData.ano_modelo}
                    onChange={handleChange}
                    required
                    error={errors.ano_modelo}
                  />

                  <div className="md:col-span-2">
                    <label htmlFor="categoria" className="block text-sm font-medium mb-1">
                      Categoria <span className="text-destructive">*</span>
                    </label>
                    <select
                      id="categoria"
                      name="categoria"
                      value={formData.categoria}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="">Selecione...</option>
                      <option value="carro">Carro</option>
                      <option value="moto">Moto</option>
                      <option value="caminhao">Caminhão</option>
                      <option value="van">Van</option>
                      <option value="onibus">Ônibus</option>
                      <option value="outro">Outro</option>
                    </select>
                    {errors.categoria && (
                      <p className="text-sm text-destructive mt-1">{errors.categoria}</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <Input
                      label="Cor"
                      id="cor"
                      name="cor"
                      value={formData.cor}
                      onChange={handleChange}
                      required
                      error={errors.cor}
                    />
                  </div>
                </div>

                {/* Descrição */}
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
                  />
                  {errors.descricao_peca && (
                    <p className="text-sm text-destructive mt-1">{errors.descricao_peca}</p>
                  )}
                </div>

                {/* Imagens */}
                <div>
                  {/* Imagens Existentes */}
                  {existingImages.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-medium mb-2">
                        Imagens Existentes ({existingImages.filter(img => !imagesToDelete.includes(img.id)).length}/{existingImages.length})
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                        {existingImages.map((image) => {
                          const isDeleted = imagesToDelete.includes(image.id);
                          const imageUrl = image.url 
                            ? (image.url.startsWith("http") 
                                ? image.url 
                                : `${import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:3001"}${image.url}`)
                            : image.nome_arquivo_fisico
                            ? `${import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:3001"}/uploads/${image.nome_arquivo_fisico}`
                            : "";

                          return (
                            <div
                              key={image.id}
                              className={`relative group aspect-square rounded-lg border-2 overflow-hidden ${
                                isDeleted
                                  ? "opacity-50 border-destructive"
                                  : "border-input"
                              }`}
                            >
                              <img
                                src={imageUrl}
                                alt={image.nome_arquivo || `Imagem ${image.id}`}
                                className="w-full h-full object-cover"
                              />
                              {isDeleted && (
                                <div className="absolute inset-0 bg-destructive/20 flex items-center justify-center">
                                  <span className="text-sm font-medium text-destructive">
                                    Será excluída
                                  </span>
                                </div>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  if (isDeleted) {
                                    // Restaurar imagem
                                    setImagesToDelete(prev => prev.filter(id => id !== image.id));
                                  } else {
                                    // Marcar para exclusão
                                    setImagesToDelete(prev => [...prev, image.id]);
                                  }
                                }}
                                className={`absolute top-2 right-2 rounded-full p-1.5 transition-opacity z-10 ${
                                  isDeleted
                                    ? "bg-primary text-primary-foreground opacity-100"
                                    : "bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100"
                                }`}
                                title={isDeleted ? "Restaurar imagem" : "Excluir imagem"}
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Upload de Novas Imagens */}
                  <div>
                    <ImageUpload
                      images={images}
                      onChange={setImages}
                      maxImages={3 - existingImages.filter(img => !imagesToDelete.includes(img.id)).length}
                      error={errors.imagens}
                    />
                  </div>
                </div>

                {/* Localização */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Cidade de Atendimento (opcional)"
                    id="cidade_atendimento"
                    name="cidade_atendimento"
                    value={formData.cidade_atendimento}
                    onChange={handleChange}
                    error={errors.cidade_atendimento}
                  />

                  <Input
                    label="UF (opcional)"
                    id="uf_atendimento"
                    name="uf_atendimento"
                    value={formData.uf_atendimento}
                    onChange={handleChange}
                    maxLength={2}
                    error={errors.uf_atendimento}
                  />
                </div>

                {/* Botões */}
                <div className="flex gap-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate(`/solicitacoes/${id}`)}
                    disabled={saving}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={saving} className="flex-1">
                    {saving ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Salvar Alterações
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

export default EditarSolicitacao;
