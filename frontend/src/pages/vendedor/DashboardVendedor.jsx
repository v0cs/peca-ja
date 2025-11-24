import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useVendedorSolicitacoes } from "../../hooks";
import api from "../../services/api";
import { Header } from "../../components/layout";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
} from "../../components/ui";
import SolicitacaoCard from "../../components/SolicitacaoCard";
import VendedorActions from "./components/VendedorActions";
import VendedorFilterBar from "./components/VendedorFilterBar";
import VendedorStats from "./components/VendedorStats";
import { Filter, RefreshCw, CheckCircle2 } from "lucide-react";
import { SOLICITACAO_STATUS, RADIX_DECIMAL } from "../../constants";

const filtrosIniciais = {
  palavraChave: "",
  marca: "",
  modelo: "",
  ano: "",
  categoria: "",
};

const DashboardVendedor = () => {
  const { user } = useAuth();
  const [filtroAtivo, setFiltroAtivo] = useState(SOLICITACAO_STATUS.DISPONIVEIS);
  const [filtrosBusca, setFiltrosBusca] = useState(filtrosIniciais);
  const [acaoEmProgresso, setAcaoEmProgresso] = useState(null);
  const [sucesso, setSucesso] = useState(null);
  const [dashboardStats, setDashboardStats] = useState({
    atendimentos_hoje: 0,
    total_atendimentos: 0,
    solicitacoes_disponiveis: 0,
    solicitacoes_vistas: 0,
  });
  const [autopecaInfo, setAutopecaInfo] = useState(null);
  const [carregandoStats, setCarregandoStats] = useState(true);
  const [erroStats, setErroStats] = useState(null);

  const {
    solicitacoes,
    loading,
    error,
    refetch,
    atenderSolicitacao,
    marcarComoVista,
    desmarcarComoVista,
    desmarcarComoAtendida,
  } = useVendedorSolicitacoes(filtroAtivo);

  const {
    solicitacoes: solicitacoesDisponiveis,
    refetch: refetchDisponiveis,
  } = useVendedorSolicitacoes(SOLICITACAO_STATUS.DISPONIVEIS, filtroAtivo === SOLICITACAO_STATUS.DISPONIVEIS);

  const {
    solicitacoes: solicitacoesAtendidas,
    refetch: refetchAtendidas,
  } = useVendedorSolicitacoes(SOLICITACAO_STATUS.ATENDIDAS, filtroAtivo === SOLICITACAO_STATUS.ATENDIDAS);

  const {
    solicitacoes: solicitacoesVistas,
    refetch: refetchVistas,
  } = useVendedorSolicitacoes(SOLICITACAO_STATUS.VISTAS, filtroAtivo === SOLICITACAO_STATUS.VISTAS);

  const carregarDashboard = useCallback(async () => {
    try {
      setCarregandoStats(true);
      setErroStats(null);

      const response = await api.get("/vendedor/dashboard");
      if (response.data.success && response.data.data) {
        const estatisticas = response.data.data.estatisticas || {};
        setDashboardStats((prev) => ({
          ...prev,
          ...estatisticas,
        }));
        setAutopecaInfo(response.data.data.autopeca || null);
      }
    } catch (err) {
      const message =
        err.response?.data?.message ||
        "Erro ao carregar estatísticas do vendedor";
      setErroStats(message);
      console.error("[DashboardVendedor] Erro ao carregar dashboard:", err);
    } finally {
      setCarregandoStats(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    carregarDashboard();
  }, [carregarDashboard]);

  const atualizarDados = useCallback(() => {
    refetch();
    if (filtroAtivo !== SOLICITACAO_STATUS.DISPONIVEIS) {
      refetchDisponiveis();
    }
    if (filtroAtivo !== SOLICITACAO_STATUS.ATENDIDAS) {
      refetchAtendidas();
    }
    if (filtroAtivo !== SOLICITACAO_STATUS.VISTAS) {
      refetchVistas();
    }
    carregarDashboard();
  }, [
    refetch,
    refetchDisponiveis,
    refetchAtendidas,
    refetchVistas,
    carregarDashboard,
    filtroAtivo,
  ]);

  const handleFiltroChange = (campo, valor) => {
    setFiltrosBusca((prev) => ({
      ...prev,
      [campo]: valor,
    }));
  };

  const limparFiltros = () => {
    setFiltrosBusca(filtrosIniciais);
  };

  const valoresUnicos = useMemo(() => {
    const marcas = new Set();
    const modelos = new Set();
    const anos = new Set();
    const categorias = new Set();

    solicitacoes.forEach((s) => {
      if (s.marca) marcas.add(s.marca);
      if (s.modelo) modelos.add(s.modelo);
      if (s.ano_fabricacao) anos.add(String(s.ano_fabricacao));
      if (s.categoria) categorias.add(s.categoria);
    });

    return {
      marcas: Array.from(marcas).sort(),
      modelos: Array.from(modelos).sort(),
      anos: Array.from(anos).sort((a, b) => parseInt(b, RADIX_DECIMAL) - parseInt(a, RADIX_DECIMAL)),
      categorias: Array.from(categorias).sort(),
    };
  }, [solicitacoes]);

  const solicitacoesFiltradas = useMemo(() => {
    return solicitacoes.filter((solicitacao) => {
      if (filtrosBusca.palavraChave) {
        const termo = filtrosBusca.palavraChave.toLowerCase();
        const combinaDescricao =
          solicitacao.descricao_peca?.toLowerCase().includes(termo) || false;
        const combinaMarca =
          solicitacao.marca?.toLowerCase().includes(termo) || false;
        const combinaModelo =
          solicitacao.modelo?.toLowerCase().includes(termo) || false;

        if (!combinaDescricao && !combinaMarca && !combinaModelo) {
          return false;
        }
      }

      if (filtrosBusca.marca && solicitacao.marca !== filtrosBusca.marca) {
        return false;
      }

      if (filtrosBusca.modelo && solicitacao.modelo !== filtrosBusca.modelo) {
        return false;
      }

      if (
        filtrosBusca.ano &&
        String(solicitacao.ano_fabricacao) !== filtrosBusca.ano
      ) {
        return false;
      }

      if (
        filtrosBusca.categoria &&
        solicitacao.categoria !== filtrosBusca.categoria
      ) {
        return false;
      }

      return true;
    });
  }, [solicitacoes, filtrosBusca]);

  const temFiltrosAtivos = useMemo(
    () => Object.values(filtrosBusca).some((valor) => valor !== ""),
    [filtrosBusca]
  );

  const ordenarSolicitacoes = useCallback(
    (lista) => {
      return [...lista].sort((a, b) => {
        const chaveData =
          filtroAtivo === "atendidas" || filtroAtivo === "vistas"
            ? b.data_marcacao || b.data_atendimento || b.data_criacao
            : b.data_criacao;
        const chaveDataA =
          filtroAtivo === "atendidas" || filtroAtivo === "vistas"
            ? a.data_marcacao || a.data_atendimento || a.data_criacao
            : a.data_criacao;

        return new Date(chaveData) - new Date(chaveDataA);
      });
    },
    [filtroAtivo]
  );

  const solicitacoesOrdenadas = useMemo(
    () => ordenarSolicitacoes(solicitacoesFiltradas),
    [solicitacoesFiltradas, ordenarSolicitacoes]
  );

  const statsPorFiltro = {
    disponiveis:
      filtroAtivo === "disponiveis"
        ? solicitacoes.length
        : solicitacoesDisponiveis.length,
    vistas:
      filtroAtivo === "vistas" ? solicitacoes.length : solicitacoesVistas.length,
    atendidas:
      filtroAtivo === "atendidas"
        ? solicitacoes.length
        : solicitacoesAtendidas.length,
  };

  const handleAtender = async (solicitacao) => {
    try {
      setAcaoEmProgresso({ id: solicitacao.id, tipo: "atender" });
      setSucesso(null);

      const resultado = await atenderSolicitacao(solicitacao.id);
      if (resultado?.link_whatsapp || resultado?.whatsapp_link) {
        const link = resultado.link_whatsapp || resultado.whatsapp_link;
        setSucesso({
          id: solicitacao.id,
          mensagem: "Solicitação atendida! Abrindo WhatsApp...",
        });
        window.open(link, "_blank");
      } else {
        alert(
          "Solicitação marcada como atendida, mas não foi possível abrir o WhatsApp automaticamente."
        );
      }

      setTimeout(() => setSucesso(null), 2500);
      atualizarDados();
    } catch (err) {
      console.error("[DashboardVendedor] Erro ao atender:", err);
      alert(err.message || "Erro ao atender solicitação");
    } finally {
      setAcaoEmProgresso(null);
    }
  };

  const handleMarcarComoVista = async (solicitacao) => {
    if (
      !window.confirm(
        "Deseja marcar esta solicitação como vista? Ela não aparecerá mais no dashboard principal."
      )
    ) {
      return;
    }

    try {
      setAcaoEmProgresso({ id: solicitacao.id, tipo: "marcar_vista" });
      await marcarComoVista(solicitacao.id);
      setSucesso({
        id: solicitacao.id,
        mensagem: "Solicitação marcada como vista!",
      });
      setTimeout(() => setSucesso(null), 2000);
      atualizarDados();
    } catch (err) {
      console.error("[DashboardVendedor] Erro ao marcar como vista:", err);
      alert(err.message || "Erro ao marcar solicitação como vista");
    } finally {
      setAcaoEmProgresso(null);
    }
  };

  const handleRetornarDashboard = async (solicitacao) => {
    try {
      setAcaoEmProgresso({ id: solicitacao.id, tipo: "desmarcar_vista" });
      await desmarcarComoVista(solicitacao.id);
      setSucesso({
        id: solicitacao.id,
        mensagem: "Solicitação retornou ao dashboard principal!",
      });
      setTimeout(() => setSucesso(null), 2000);
      atualizarDados();
    } catch (err) {
      console.error("[DashboardVendedor] Erro ao retornar solicitação:", err);
      alert(err.message || "Erro ao retornar solicitação");
    } finally {
      setAcaoEmProgresso(null);
    }
  };

  const handleDesmarcarAtendida = async (solicitacao) => {
    if (
      !window.confirm(
        "Deseja reabrir esta solicitação? Ela voltará a aparecer como disponível para todos os vendedores."
      )
    ) {
      return;
    }

    try {
      setAcaoEmProgresso({ id: solicitacao.id, tipo: "desmarcar_atendida" });
      await desmarcarComoAtendida(solicitacao.id);
      setSucesso({
        id: solicitacao.id,
        mensagem: "Solicitação reaberta com sucesso!",
      });
      setTimeout(() => setSucesso(null), 2000);
      atualizarDados();
    } catch (err) {
      console.error(
        "[DashboardVendedor] Erro ao desmarcar atendimento:",
        err
      );
      alert(err.message || "Erro ao reabrir a solicitação");
    } finally {
      setAcaoEmProgresso(null);
    }
  };

  const atualizarManualmente = () => {
    atualizarDados();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-card/50">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Dashboard do Vendedor</h2>
              <p className="text-muted-foreground">
                Gerencie as solicitações da sua cidade com agilidade
              </p>
              {erroStats && (
                <p className="text-sm text-destructive mt-2">{erroStats}</p>
              )}
        </div>

        <VendedorStats
          cidade={
            autopecaInfo?.cidade ||
            user?.perfil?.endereco_cidade ||
            user?.perfil?.autopeca?.endereco_cidade
          }
          stats={{
            disponiveis: statsPorFiltro.disponiveis,
            vistas: statsPorFiltro.vistas,
            atendidas: statsPorFiltro.atendidas,
          }}
          atendimentosHoje={dashboardStats.atendimentos_hoje}
          totalAtendimentos={dashboardStats.total_atendimentos}
        />

        <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">
              Status:
            </span>
            <div className="flex gap-2">
              <Button
                variant={filtroAtivo === "disponiveis" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setFiltroAtivo("disponiveis");
                  limparFiltros();
                }}
              >
                Disponíveis ({statsPorFiltro.disponiveis})
              </Button>
              <Button
                variant={filtroAtivo === "vistas" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setFiltroAtivo("vistas");
                  limparFiltros();
                }}
              >
                Visualizadas ({statsPorFiltro.vistas})
              </Button>
              <Button
                variant={filtroAtivo === "atendidas" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setFiltroAtivo("atendidas");
                  limparFiltros();
                }}
              >
                Atendidas ({statsPorFiltro.atendidas})
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2">
          {carregandoStats && (
            <span className="text-xs text-muted-foreground">
              Atualizando estatísticas...
            </span>
          )}
            <Button
              variant="ghost"
              size="sm"
              onClick={atualizarManualmente}
              className="ml-auto"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Atualizar
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between mb-4">
              <CardTitle className="text-xl font-semibold">
                {filtroAtivo === "disponiveis"
                  ? "Solicitações Disponíveis"
                  : filtroAtivo === "vistas"
                  ? "Solicitações Visualizadas"
                  : "Solicitações Atendidas"}
              </CardTitle>
              {temFiltrosAtivos && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={limparFiltros}
                  className="text-muted-foreground"
                >
                  Limpar filtros
                </Button>
              )}
            </div>

            <VendedorFilterBar
              filtros={filtrosBusca}
              onFiltroChange={handleFiltroChange}
              onLimparFiltros={limparFiltros}
              valoresUnicos={valoresUnicos}
              temFiltrosAtivos={temFiltrosAtivos}
              quantidadeResultados={solicitacoesOrdenadas.length}
            />
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

            {!loading && !error && solicitacoesOrdenadas.length === 0 && (
              <EmptyState
                title={
                  temFiltrosAtivos
                    ? "Nenhuma solicitação encontrada"
                    : filtroAtivo === "disponiveis"
                    ? "Nenhuma solicitação disponível"
                    : filtroAtivo === "vistas"
                    ? "Nenhuma solicitação marcada como vista"
                    : "Nenhuma solicitação atendida"
                }
                message={
                  temFiltrosAtivos
                    ? "Não encontramos solicitações que atendam aos filtros selecionados."
                    : filtroAtivo === "disponiveis"
                    ? "Fique atento! Novas solicitações podem chegar a qualquer momento."
                    : filtroAtivo === "vistas"
                    ? "Você ainda não marcou nenhuma solicitação como vista."
                    : "Quando você atender solicitações, elas aparecerão aqui."
                }
                actionLabel={
                  temFiltrosAtivos
                    ? "Limpar filtros"
                    : filtroAtivo !== "disponiveis"
                    ? "Ver solicitações disponíveis"
                    : undefined
                }
                onAction={
                  temFiltrosAtivos
                    ? limparFiltros
                    : filtroAtivo !== "disponiveis"
                    ? () => setFiltroAtivo("disponiveis")
                    : undefined
                }
              />
            )}

            {!loading && !error && solicitacoesOrdenadas.length > 0 && (
              <div className="space-y-4">
                {solicitacoesOrdenadas.map((solicitacao) => (
                  <div key={solicitacao.id} className="relative">
                    <SolicitacaoCard
                      solicitacao={solicitacao}
                      tipoUsuario="vendedor"
                      renderActions={() => (
                        <VendedorActions
                          solicitacao={solicitacao}
                          contexto={filtroAtivo}
                          onAtender={handleAtender}
                          onMarcarComoVista={handleMarcarComoVista}
                          onRetornarDashboard={handleRetornarDashboard}
                          onDesmarcarAtendida={handleDesmarcarAtendida}
                          processando={
                            acaoEmProgresso?.id === solicitacao.id
                          }
                          processandoTipo={
                            acaoEmProgresso?.id === solicitacao.id
                              ? acaoEmProgresso?.tipo
                              : null
                          }
                        />
                      )}
                    />
                    {acaoEmProgresso?.id === solicitacao.id && (
                      <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-lg z-10">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                          <p className="text-sm text-muted-foreground">
                            {{
                              atender: "Marcando como atendida...",
                              marcar_vista: "Marcando como vista...",
                              desmarcar_vista: "Retornando ao dashboard...",
                              desmarcar_atendida: "Reabrindo solicitação...",
                            }[acaoEmProgresso.tipo] || "Processando..."}
                          </p>
                        </div>
                      </div>
                    )}
                    {sucesso?.id === solicitacao.id && (
                      <div className="absolute top-4 right-4 bg-green-50 border border-green-200 rounded-lg p-3 z-10 flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        <p className="text-sm text-green-800">
                          {sucesso.mensagem}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardVendedor;


