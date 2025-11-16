import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useSolicitacoes } from "../hooks";
import { Header } from "../components/layout";
import { Button, StatsCard, EmptyState, Card, CardContent, CardDescription, CardHeader, CardTitle, Badge } from "../components/ui";
import SolicitacaoCard from "../components/SolicitacaoCard";
import { Clock, CheckCircle, MessageCircle, Filter } from "lucide-react";
import api from "../services/api";

const DashboardCliente = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { solicitacoes, loading, error, refetch } = useSolicitacoes();
  const [statusFilter, setStatusFilter] = useState("todas"); // "todas", "ativa", "concluida", "cancelada"
  const [marcandoConcluida, setMarcandoConcluida] = useState(false);

  // Filtrar solicitações por status
  const solicitacoesFiltradas = solicitacoes.filter((s) => {
    if (statusFilter === "todas") return true;
    return s.status_cliente === statusFilter;
  });

  // Calcular estatísticas
  const stats = {
    total: solicitacoes.length,
    ativas: solicitacoes.filter((s) => s.status_cliente === "ativa").length,
    concluidas: solicitacoes.filter((s) => s.status_cliente === "concluida").length,
    canceladas: solicitacoes.filter((s) => s.status_cliente === "cancelada").length,
  };

  // Ordenar solicitações por data (mais recentes primeiro)
  const solicitacoesOrdenadas = [...solicitacoesFiltradas].sort((a, b) => {
    const dateA = new Date(a.data_criacao || a.created_at);
    const dateB = new Date(b.data_criacao || b.created_at);
    return dateB - dateA;
  });

  const getStatusLabel = (status) => {
    const labels = {
      todas: "todas",
      ativa: "ativas",
      concluida: "concluídas",
      cancelada: "canceladas",
    };
    return labels[status] || status;
  };

  const handleMarcarConcluida = async (solicitacao) => {
    if (
      !window.confirm(
        "Tem certeza que deseja marcar esta solicitação como concluída? As autopeças não poderão mais visualizá-la."
      )
    ) {
      return;
    }

    setMarcandoConcluida(true);
    try {
      const response = await api.put(`/solicitacoes/${solicitacao.id}`, {
        status_cliente: "concluida",
      });

      if (response.data.success) {
        alert("Solicitação marcada como concluída com sucesso!");
        // Recarregar lista de solicitações
        if (refetch) {
          await refetch();
        }
      } else {
        alert(response.data.message || "Erro ao marcar solicitação como concluída");
      }
    } catch (err) {
      const message =
        err.response?.data?.message || "Erro ao marcar solicitação como concluída";
      alert(message);
    } finally {
      setMarcandoConcluida(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-card/50">
      <Header />

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
            <div>
              <h2 className="text-3xl font-bold mb-2">Bem-vindo ao seu dashboard</h2>
            <p className="text-muted-foreground">
              Gerencie suas solicitações de autopeças e acompanhe o progresso
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total de Solicitações"
            value={stats.total}
            icon={<Clock className="h-4 w-4" />}
          />
          <StatsCard
            title="Solicitações Ativas"
            value={stats.ativas}
            icon={<Clock className="h-4 w-4" />}
          />
          <StatsCard
            title="Concluídas"
            value={stats.concluidas}
            icon={<CheckCircle className="h-4 w-4" />}
          />
          <StatsCard
            title="Canceladas"
            value={stats.canceladas}
            icon={<MessageCircle className="h-4 w-4" />}
          />
        </div>

        {/* Main Content */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-semibold">Suas Solicitações</CardTitle>
              {/* Filtros de Status */}
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <div className="flex gap-2">
                  <Button
                    variant={statusFilter === "todas" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter("todas")}
                  >
                    Todas ({stats.total})
                  </Button>
                  <Button
                    variant={statusFilter === "ativa" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter("ativa")}
                  >
                    Ativas ({stats.ativas})
                  </Button>
                  <Button
                    variant={statusFilter === "concluida" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter("concluida")}
                  >
                    Concluídas ({stats.concluidas})
                  </Button>
                  <Button
                    variant={statusFilter === "cancelada" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter("cancelada")}
                  >
                    Canceladas ({stats.canceladas})
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading && (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            )}

            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            {!loading && !error && (
              <>
                {/* Se não tem nenhuma solicitação criada */}
                {solicitacoes.length === 0 && (
                  <EmptyState
                    title="Nenhuma solicitação encontrada"
                    message="Você ainda não criou nenhuma solicitação. Comece criando sua primeira solicitação de orçamento!"
                    actionLabel="Criar Primeira Solicitação"
                    onAction={() => navigate("/solicitacoes/nova")}
                  />
                )}

                {/* Se tem solicitações mas nenhuma no filtro atual */}
                {solicitacoes.length > 0 && solicitacoesOrdenadas.length === 0 && (
                  <EmptyState
                    title={
                      statusFilter === "concluida"
                        ? "Nenhuma solicitação concluída encontrada"
                        : `Nenhuma solicitação ${getStatusLabel(statusFilter)} encontrada`
                    }
                    message={
                      statusFilter === "concluida"
                        ? "Você não possui solicitações marcadas como concluídas no momento."
                        : `Não há solicitações com status "${getStatusLabel(statusFilter)}" no momento.`
                    }
                  />
                )}

                {/* Se tem solicitações no filtro atual, mostrar lista */}
                {solicitacoesOrdenadas.length > 0 && (
                  <div className="space-y-4">
                    {solicitacoesOrdenadas.map((solicitacao) => (
                      <SolicitacaoCard
                        key={solicitacao.id}
                        solicitacao={solicitacao}
                        tipoUsuario="cliente"
                        onMarcarConcluida={handleMarcarConcluida}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardCliente;
