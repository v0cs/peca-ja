import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Header } from "../components/layout";
import { Button, Card, CardContent, CardHeader, CardTitle, LoadingSpinner } from "../components/ui";
import { ImageGallery, SolicitationStatus } from "../components";
import { useSolicitacao, useSolicitacoesDisponiveis } from "../hooks";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";
import { ArrowLeft, Edit, X, Calendar, Car, MapPin, MessageCircle, XCircle, Eye } from "lucide-react";

const DetalheSolicitacao = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { solicitacao, loading, error, cancelarSolicitacao } = useSolicitacao(id);
  
  const isAutopeca = user?.tipo_usuario === "autopeca" || user?.tipo === "autopeca";
  const isCliente = user?.tipo_usuario === "cliente" || user?.tipo === "cliente";
  
  // Só usar o hook se for autopeça (evitar 403)
  const { atenderSolicitacao, marcarComoLida, desmarcarComoVista } = useSolicitacoesDisponiveis("disponiveis", !isAutopeca);
  
  const [cancelando, setCancelando] = useState(false);
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);
  const [atendendo, setAtendendo] = useState(false);
  const [desmarcando, setDesmarcando] = useState(false);
  const [marcandoComoVista, setMarcandoComoVista] = useState(false);
  const [desmarcandoComoVista, setDesmarcandoComoVista] = useState(false);
  const [foiAtendida, setFoiAtendida] = useState(false);
  const [foiVista, setFoiVista] = useState(false);

  // Verificar se a solicitação foi atendida ou vista pela autopeça
  useEffect(() => {
    const verificarStatus = async () => {
      if (isAutopeca && solicitacao && solicitacao.id) {
        try {
          // Verificar se existe nas solicitações atendidas
          const [responseAtendidas, responseVistas] = await Promise.all([
            api.get("/autopecas/solicitacoes-atendidas"),
            api.get("/autopecas/solicitacoes-vistas"),
          ]);
          
          if (responseAtendidas.data.success) {
            const atendidas = responseAtendidas.data.data.solicitacoes || [];
            const foiAtendida = atendidas.some((s) => s.id === solicitacao.id);
            setFoiAtendida(foiAtendida);
          }
          
          if (responseVistas.data.success) {
            const vistas = responseVistas.data.data.solicitacoes || [];
            const foiVista = vistas.some((s) => s.id === solicitacao.id);
            setFoiVista(foiVista);
          }
        } catch (err) {
          console.error("Erro ao verificar status:", err);
        }
      }
    };

    verificarStatus();
  }, [isAutopeca, solicitacao]);

  const formatDate = (dateString) => {
    if (!dateString) return "Não informado";
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleCancelar = async () => {
    setCancelando(true);
    const result = await cancelarSolicitacao();
    setCancelando(false);
    setShowConfirmCancel(false);

    if (result.success) {
      navigate("/dashboard/cliente");
    } else {
      alert(result.message || "Erro ao cancelar solicitação");
    }
  };

  const handleAtender = async () => {
    if (!window.confirm("Deseja marcar esta solicitação como atendida e abrir o WhatsApp do cliente?")) {
      return;
    }

    setAtendendo(true);
    try {
      console.log(`📞 [DetalheSolicitacao] Atendendo solicitação ${id}`);
      const resultado = await atenderSolicitacao(id);
      console.log(`📞 [DetalheSolicitacao] Resultado:`, resultado);
      
      if (resultado && (resultado.link_whatsapp || resultado.whatsapp_link)) {
        const linkWhatsApp = resultado.link_whatsapp || resultado.whatsapp_link;
        console.log(`📞 [DetalheSolicitacao] Link WhatsApp:`, linkWhatsApp);
        
        // Abrir WhatsApp imediatamente
        window.open(linkWhatsApp, "_blank");
        
        alert("Solicitação marcada como atendida! Abrindo WhatsApp...");
        
        // Atualizar estado e redirecionar
        setFoiAtendida(true);
        setTimeout(() => {
          navigate("/dashboard/autopeca");
        }, 500);
      } else {
        console.error(`❌ [DetalheSolicitacao] Resultado não contém link WhatsApp:`, resultado);
        alert("Solicitação marcada como atendida, mas não foi possível abrir o WhatsApp. Verifique os dados do cliente.");
        setFoiAtendida(true);
        setTimeout(() => {
          navigate("/dashboard/autopeca");
        }, 500);
      }
    } catch (err) {
      console.error(`❌ [DetalheSolicitacao] Erro ao atender:`, err);
      alert(err.message || "Erro ao atender solicitação");
      setAtendendo(false);
    }
  };

  const handleDesmarcar = async () => {
    if (!window.confirm("Tem certeza que deseja desmarcar esta solicitação como atendida? Ela voltará a aparecer nas solicitações disponíveis.")) {
      return;
    }

    setDesmarcando(true);
    try {
      const response = await api.delete(`/autopecas/solicitacoes/${id}/atender`);
      
      if (response.data.success) {
        alert("Solicitação desmarcada como atendida com sucesso!");
        setFoiAtendida(false);
        navigate("/dashboard/autopeca");
      } else {
        alert(response.data.message || "Erro ao desmarcar solicitação");
      }
    } catch (err) {
      console.error("Erro ao desmarcar:", err);
      alert(err.response?.data?.message || "Erro ao desmarcar solicitação como atendida");
    } finally {
      setDesmarcando(false);
    }
  };

  const handleMarcarComoVista = async () => {
    if (!window.confirm("Deseja marcar esta solicitação como vista? Ela não aparecerá mais no dashboard principal.")) {
      return;
    }

    setMarcandoComoVista(true);
    try {
      await marcarComoLida(id);
      alert("Solicitação marcada como vista com sucesso!");
      setFoiVista(true);
      navigate("/dashboard/autopeca");
    } catch (err) {
      console.error("Erro ao marcar como vista:", err);
      alert(err.message || "Erro ao marcar solicitação como vista");
    } finally {
      setMarcandoComoVista(false);
    }
  };

  const handleDesmarcarComoVista = async () => {
    if (!window.confirm("Deseja retornar esta solicitação ao dashboard principal? Ela voltará a aparecer nas solicitações disponíveis.")) {
      return;
    }

    setDesmarcandoComoVista(true);
    try {
      await desmarcarComoVista(id);
      alert("Solicitação retornada ao dashboard com sucesso!");
      setFoiVista(false);
      navigate("/dashboard/autopeca");
    } catch (err) {
      console.error("Erro ao desmarcar como vista:", err);
      alert(err.message || "Erro ao retornar solicitação ao dashboard");
    } finally {
      setDesmarcandoComoVista(false);
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
    const dashboardPath = isAutopeca ? "/dashboard/autopeca" : "/dashboard/cliente";
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-card/50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-destructive mb-4">{error || "Solicitação não encontrada"}</p>
              <Button onClick={() => navigate(dashboardPath)}>
                Voltar para Dashboard
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-card/50">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate(isAutopeca ? "/dashboard/autopeca" : "/dashboard/cliente")}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Dashboard
            </Button>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Detalhes da Solicitação</h1>
                <p className="text-muted-foreground mt-2">ID: {solicitacao.id}</p>
              </div>
              <SolicitationStatus status={solicitacao.status_cliente} />
            </div>
          </div>

          <div className="grid gap-6">
            {/* Informações do Veículo */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="h-5 w-5" />
                  Dados do Veículo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Placa</p>
                    <p className="font-medium">{solicitacao.placa || "Não informado"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Marca</p>
                    <p className="font-medium">{solicitacao.marca || "Não informado"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Modelo</p>
                    <p className="font-medium">{solicitacao.modelo || "Não informado"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Ano de Fabricação</p>
                    <p className="font-medium">{solicitacao.ano_fabricacao || "Não informado"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Ano do Modelo</p>
                    <p className="font-medium">{solicitacao.ano_modelo || "Não informado"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Categoria</p>
                    <p className="font-medium capitalize">{solicitacao.categoria || "Não informado"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Cor</p>
                    <p className="font-medium">{solicitacao.cor || "Não informado"}</p>
                  </div>
                  {(solicitacao.cidade_atendimento || solicitacao.uf_atendimento) && (
                    <div>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        Localização
                      </p>
                      <p className="font-medium">
                        {solicitacao.cidade_atendimento || ""}
                        {solicitacao.cidade_atendimento && solicitacao.uf_atendimento && ", "}
                        {solicitacao.uf_atendimento || ""}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Descrição da Peça */}
            <Card>
              <CardHeader>
                <CardTitle>Descrição da Peça</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{solicitacao.descricao_peca || "Sem descrição"}</p>
              </CardContent>
            </Card>

            {/* Imagens */}
            {solicitacao.imagens && solicitacao.imagens.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Imagens</CardTitle>
                </CardHeader>
                <CardContent>
                  <ImageGallery images={solicitacao.imagens} />
                </CardContent>
              </Card>
            )}

            {/* Informações Adicionais */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Informações Adicionais
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Data de Criação</p>
                    <p className="font-medium">{formatDate(solicitacao.data_criacao || solicitacao.created_at)}</p>
                  </div>
                  {solicitacao.origem_dados_veiculo && (
                    <div>
                      <p className="text-sm text-muted-foreground">Origem dos Dados</p>
                      <p className="font-medium capitalize">
                        {solicitacao.origem_dados_veiculo === "api" ? "Consulta Automática" : "Preenchimento Manual"}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Ações */}
            {solicitacao.status_cliente === "ativa" && (
              <Card>
                <CardHeader>
                  <CardTitle>Ações</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4 flex-wrap">
                    {/* Ações para Cliente */}
                    {isCliente && (
                      <>
                        <Button
                          onClick={() => navigate(`/solicitacoes/${id}/editar`)}
                          variant="outline"
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Editar Solicitação
                        </Button>
                        <Button
                          onClick={() => setShowConfirmCancel(true)}
                          variant="destructive"
                          disabled={cancelando}
                        >
                          <X className="mr-2 h-4 w-4" />
                          {cancelando ? "Cancelando..." : "Cancelar Solicitação"}
                        </Button>
                      </>
                    )}
                    
                    {/* Ações para Autopeça */}
                    {isAutopeca && (
                      <>
                        {!foiAtendida && !foiVista && solicitacao.status_cliente === "ativa" && (
                          <>
                            <Button
                              onClick={handleAtender}
                              disabled={atendendo}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <MessageCircle className="mr-2 h-4 w-4" />
                              {atendendo ? "Processando..." : "Atender via WhatsApp"}
                            </Button>
                            <Button
                              onClick={handleMarcarComoVista}
                              disabled={marcandoComoVista}
                              variant="outline"
                              className="text-muted-foreground hover:bg-muted"
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              {marcandoComoVista ? "Processando..." : "Marcar como Vista"}
                            </Button>
                          </>
                        )}
                        {foiAtendida && (
                          <Button
                            onClick={handleDesmarcar}
                            disabled={desmarcando}
                            variant="outline"
                            className="text-orange-600 border-orange-300 hover:bg-orange-50 hover:border-orange-400"
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            {desmarcando ? "Desmarcando..." : "Desmarcar como Atendida"}
                          </Button>
                        )}
                        {foiVista && !foiAtendida && (
                          <Button
                            onClick={handleDesmarcarComoVista}
                            disabled={desmarcandoComoVista}
                            variant="outline"
                            className="text-primary border-primary/20 hover:bg-primary/10"
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            {desmarcandoComoVista ? "Processando..." : "Retornar ao Dashboard"}
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Modal de Confirmação de Cancelamento */}
          {showConfirmCancel && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <Card className="max-w-md w-full">
                <CardHeader>
                  <CardTitle>Confirmar Cancelamento</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-4">
                    Tem certeza que deseja cancelar esta solicitação? Esta ação não pode ser desfeita.
                  </p>
                  <div className="flex gap-4">
                    <Button
                      variant="outline"
                      onClick={() => setShowConfirmCancel(false)}
                      className="flex-1"
                    >
                      Não, manter ativa
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleCancelar}
                      disabled={cancelando}
                      className="flex-1"
                    >
                      {cancelando ? <LoadingSpinner size="sm" /> : "Sim, cancelar"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default DetalheSolicitacao;
