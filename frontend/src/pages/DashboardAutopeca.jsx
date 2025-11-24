import { useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useSolicitacoesDisponiveis } from "../hooks";
import { Header } from "../components/layout";
import { Button, StatsCard, EmptyState, Card, CardContent, CardHeader, CardTitle, Input } from "../components/ui";
import SolicitacaoCard from "../components/SolicitacaoCard";
import { Clock, CheckCircle, RefreshCw, CheckCircle2, Filter, Eye, Search, X as XIcon } from "lucide-react";
import api from "../services/api";
import { SOLICITACAO_STATUS, RADIX_DECIMAL } from "../constants";

const DashboardAutopeca = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [filtroAtivo, setFiltroAtivo] = useState(SOLICITACAO_STATUS.DISPONIVEIS);
  const { solicitacoes, loading, error, atenderSolicitacao, marcarComoLida, desmarcarComoVista, refetch } = useSolicitacoesDisponiveis(filtroAtivo);
  
  // Buscar estatísticas separadamente para os cards (evitar duplicação com filtro ativo)
  const { solicitacoes: solicitacoesDisponiveis, refetch: refetchDisponiveis } = useSolicitacoesDisponiveis(SOLICITACAO_STATUS.DISPONIVEIS, filtroAtivo === SOLICITACAO_STATUS.DISPONIVEIS);
  const { solicitacoes: solicitacoesAtendidas, refetch: refetchAtendidas } = useSolicitacoesDisponiveis(SOLICITACAO_STATUS.ATENDIDAS, filtroAtivo === SOLICITACAO_STATUS.ATENDIDAS);
  const { solicitacoes: solicitacoesVistas, refetch: refetchVistas } = useSolicitacoesDisponiveis(SOLICITACAO_STATUS.VISTAS, filtroAtivo === SOLICITACAO_STATUS.VISTAS);
  
  // Função para atualizar todas as estatísticas
  const atualizarTodasEstatisticas = () => {
    if (filtroAtivo !== SOLICITACAO_STATUS.DISPONIVEIS) refetchDisponiveis();
    if (filtroAtivo !== SOLICITACAO_STATUS.ATENDIDAS) refetchAtendidas();
    if (filtroAtivo !== SOLICITACAO_STATUS.VISTAS) refetchVistas();
    refetch(); // Atualizar o filtro ativo
  };
  
  const [atendendo, setAtendendo] = useState(null);
  const [sucesso, setSucesso] = useState(null);

  // Estados para filtros de busca
  const [filtrosBusca, setFiltrosBusca] = useState({
    palavraChave: "",
    marca: "",
    modelo: "",
    ano: "",
    categoria: "",
  });

  const handleAtender = async (solicitacao) => {
    try {
      setAtendendo(solicitacao.id);
      setSucesso(null);
      
      console.log(`📞 [DashboardAutopeca] Atendendo solicitação ${solicitacao.id}`);
      const resultado = await atenderSolicitacao(solicitacao.id);
      console.log(`📞 [DashboardAutopeca] Resultado:`, resultado);
      
      if (resultado && (resultado.link_whatsapp || resultado.whatsapp_link)) {
        const linkWhatsApp = resultado.link_whatsapp || resultado.whatsapp_link;
        console.log(`📞 [DashboardAutopeca] Link WhatsApp:`, linkWhatsApp);
        
        // Mostrar mensagem de sucesso
        setSucesso({
          id: solicitacao.id,
          mensagem: "Solicitação marcada como atendida! Abrindo WhatsApp...",
        });
        
        // Abrir WhatsApp em nova aba
        window.open(linkWhatsApp, "_blank");
        
        // Atualizar lista de solicitações e estatísticas após 1 segundo
        setTimeout(() => {
          atualizarTodasEstatisticas();
          setSucesso(null);
        }, 2000);
      } else {
        console.error(`❌ [DashboardAutopeca] Resultado não contém link WhatsApp:`, resultado);
        alert("Solicitação marcada como atendida, mas não foi possível abrir o WhatsApp. Verifique os dados do cliente.");
        atualizarTodasEstatisticas();
      }
    } catch (err) {
      console.error(`❌ [DashboardAutopeca] Erro ao atender:`, err);
      alert(err.message || "Erro ao atender solicitação");
    } finally {
      setAtendendo(null);
    }
  };

  const handleDesmarcar = async (solicitacao) => {
    if (!window.confirm("Tem certeza que deseja desmarcar esta solicitação como atendida? Ela voltará a aparecer nas solicitações disponíveis.")) {
      return;
    }

    try {
      const response = await api.delete(`/autopecas/solicitacoes/${solicitacao.id}/atender`);
      
      if (response.data.success) {
        alert("Solicitação desmarcada como atendida com sucesso!");
        atualizarTodasEstatisticas();
      } else {
        alert(response.data.message || "Erro ao desmarcar solicitação");
      }
    } catch (err) {
      console.error("Erro ao desmarcar:", err);
      alert(err.response?.data?.message || "Erro ao desmarcar solicitação como atendida");
    }
  };

  const handleMarcarComoVista = async (solicitacao) => {
    if (!window.confirm("Deseja marcar esta solicitação como vista? Ela não aparecerá mais no dashboard principal.")) {
      return;
    }

    try {
      await marcarComoLida(solicitacao.id);
      alert("Solicitação marcada como vista com sucesso!");
      atualizarTodasEstatisticas();
    } catch (err) {
      console.error("Erro ao marcar como vista:", err);
      alert(err.message || "Erro ao marcar solicitação como vista");
    }
  };

  // Função para atualizar filtros de busca
  const handleFiltroChange = (campo, valor) => {
    setFiltrosBusca((prev) => ({
      ...prev,
      [campo]: valor,
    }));
  };

  // Função para limpar todos os filtros
  const limparFiltros = () => {
    setFiltrosBusca({
      palavraChave: "",
      marca: "",
      modelo: "",
      ano: "",
      categoria: "",
    });
  };

  // Obter valores únicos para os selects de filtro
  const valoresUnicos = useMemo(() => {
    const marcas = new Set();
    const modelos = new Set();
    const anos = new Set();
    const categorias = new Set();

    solicitacoes.forEach((s) => {
      if (s.marca) marcas.add(s.marca);
      if (s.modelo) modelos.add(s.modelo);
      if (s.ano_fabricacao) anos.add(s.ano_fabricacao.toString());
      if (s.categoria) categorias.add(s.categoria);
    });

    return {
      marcas: Array.from(marcas).sort(),
      modelos: Array.from(modelos).sort(),
      anos: Array.from(anos).sort((a, b) => parseInt(b, RADIX_DECIMAL) - parseInt(a, RADIX_DECIMAL)),
      categorias: Array.from(categorias).sort(),
    };
  }, [solicitacoes]);

  // Filtrar solicitações baseado nos filtros de busca
  const solicitacoesFiltradas = useMemo(() => {
    return solicitacoes.filter((solicitacao) => {
      // Filtro por palavra-chave (busca em descrição, marca, modelo)
      if (filtrosBusca.palavraChave) {
        const palavraChave = filtrosBusca.palavraChave.toLowerCase();
        const buscaEmDescricao = solicitacao.descricao_peca?.toLowerCase().includes(palavraChave) || false;
        const buscaEmMarca = solicitacao.marca?.toLowerCase().includes(palavraChave) || false;
        const buscaEmModelo = solicitacao.modelo?.toLowerCase().includes(palavraChave) || false;
        
        if (!buscaEmDescricao && !buscaEmMarca && !buscaEmModelo) {
          return false;
        }
      }

      // Filtro por marca
      if (filtrosBusca.marca && solicitacao.marca !== filtrosBusca.marca) {
        return false;
      }

      // Filtro por modelo
      if (filtrosBusca.modelo && solicitacao.modelo !== filtrosBusca.modelo) {
        return false;
      }

      // Filtro por ano
      if (filtrosBusca.ano && solicitacao.ano_fabricacao?.toString() !== filtrosBusca.ano) {
        return false;
      }

      // Filtro por categoria
      if (filtrosBusca.categoria && solicitacao.categoria !== filtrosBusca.categoria) {
        return false;
      }

      return true;
    });
  }, [solicitacoes, filtrosBusca]);

  // Verificar se há filtros ativos
  const temFiltrosAtivos = Object.values(filtrosBusca).some((valor) => valor !== "");

  const handleDesmarcarComoVista = async (solicitacao) => {
    if (!window.confirm("Deseja retornar esta solicitação ao dashboard principal? Ela voltará a aparecer nas solicitações disponíveis.")) {
      return;
    }

    try {
      await desmarcarComoVista(solicitacao.id);
      alert("Solicitação retornada ao dashboard com sucesso!");
      atualizarTodasEstatisticas();
    } catch (err) {
      console.error("Erro ao desmarcar como vista:", err);
      alert(err.message || "Erro ao retornar solicitação ao dashboard");
    }
  };

  // Calcular estatísticas
  // Se o filtro ativo é o mesmo, usar a lista principal para evitar duplicação
  const stats = {
    disponiveis: filtroAtivo === "disponiveis" ? solicitacoes.length : solicitacoesDisponiveis.length,
    atendidas: filtroAtivo === "atendidas" ? solicitacoes.length : solicitacoesAtendidas.length,
    vistas: filtroAtivo === "vistas" ? solicitacoes.length : solicitacoesVistas.length,
  };

  // Ordenar solicitações filtradas por data (mais recentes primeiro)
  // Para atendidas/vistas, usar data_marcacao; para disponíveis, usar data_criacao
  const solicitacoesOrdenadas = [...solicitacoesFiltradas].sort((a, b) => {
    const dateA = new Date(
      filtroAtivo === "atendidas" || filtroAtivo === "vistas"
        ? (a.data_atendimento || a.data_marcacao || a.data_criacao || a.created_at)
        : (a.data_criacao || a.created_at)
    );
    const dateB = new Date(
      filtroAtivo === "atendidas" || filtroAtivo === "vistas"
        ? (b.data_atendimento || b.data_marcacao || b.data_criacao || b.created_at)
        : (b.data_criacao || b.created_at)
    );
    return dateB - dateA;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-card/50">
      <Header />

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
            <div>
              <h2 className="text-3xl font-bold mb-2">Dashboard da Autopeça</h2>
              <p className="text-muted-foreground">
                Gerencie solicitações de clientes da sua cidade e sua equipe de vendedores
              </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <StatsCard
            title="Solicitações Disponíveis"
            value={stats.disponiveis}
            subtitle={`Na cidade de ${user?.perfil?.endereco_cidade || "sua cidade"}`}
            icon={<Clock className="h-4 w-4" />}
          />
          <StatsCard
            title="Solicitações Atendidas"
            value={stats.atendidas}
            subtitle="Total de solicitações que você atendeu"
            icon={<CheckCircle className="h-4 w-4" />}
          />
          <StatsCard
            title="Solicitações Vistas"
            value={stats.vistas}
            subtitle="Solicitações marcadas como vistas"
            icon={<Eye className="h-4 w-4" />}
          />
        </div>

        {/* Filtros de Status - Acima do Card */}
        <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Status:</span>
            <div className="flex gap-2">
              <Button 
                variant={filtroAtivo === "disponiveis" ? "default" : "outline"} 
                size="sm" 
                onClick={() => {
                  setFiltroAtivo("disponiveis");
                  limparFiltros();
                }}
              >
                Disponíveis ({stats.disponiveis || 0})
              </Button>
              <Button 
                variant={filtroAtivo === "atendidas" ? "default" : "outline"} 
                size="sm" 
                onClick={() => {
                  setFiltroAtivo("atendidas");
                  limparFiltros();
                }}
              >
                Atendidas ({stats.atendidas || 0})
              </Button>
              <Button 
                variant={filtroAtivo === "vistas" ? "default" : "outline"} 
                size="sm" 
                onClick={() => {
                  setFiltroAtivo("vistas");
                  limparFiltros();
                }}
              >
                Vistas ({stats.vistas || 0})
              </Button>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={atualizarTodasEstatisticas}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Atualizar
          </Button>
        </div>

        {/* Main Content */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between mb-4">
              <CardTitle className="text-xl font-semibold">
                {filtroAtivo === "disponiveis" 
                  ? "Solicitações Disponíveis"
                  : filtroAtivo === "atendidas"
                  ? "Solicitações Atendidas"
                  : "Solicitações Vistas"}
              </CardTitle>
              {temFiltrosAtivos && (
                <Button variant="ghost" size="sm" onClick={limparFiltros} className="text-muted-foreground">
                  <XIcon className="mr-2 h-4 w-4" />
                  Limpar Filtros
                </Button>
              )}
            </div>

            {/* Filtros de Busca */}
            <div className="space-y-4 pt-4 border-t">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Busca por Palavra-chave */}
                <div className="lg:col-span-3">
                  <Input
                    label="Buscar por palavra-chave"
                    id="palavra-chave"
                    type="text"
                    placeholder="Digite palavras-chave (descrição, marca, modelo)..."
                    value={filtrosBusca.palavraChave}
                    onChange={(e) => handleFiltroChange("palavraChave", e.target.value)}
                    className="w-full"
                  />
                </div>

                {/* Filtro por Marca */}
                <div>
                  <label htmlFor="filtro-marca" className="block text-sm font-medium mb-1">
                    Marca
                  </label>
                  <select
                    id="filtro-marca"
                    value={filtrosBusca.marca}
                    onChange={(e) => handleFiltroChange("marca", e.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Todas as marcas</option>
                    {valoresUnicos.marcas.map((marca) => (
                      <option key={marca} value={marca}>
                        {marca}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filtro por Modelo */}
                <div>
                  <label htmlFor="filtro-modelo" className="block text-sm font-medium mb-1">
                    Modelo
                  </label>
                  <select
                    id="filtro-modelo"
                    value={filtrosBusca.modelo}
                    onChange={(e) => handleFiltroChange("modelo", e.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Todos os modelos</option>
                    {valoresUnicos.modelos.map((modelo) => (
                      <option key={modelo} value={modelo}>
                        {modelo}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filtro por Ano */}
                <div>
                  <label htmlFor="filtro-ano" className="block text-sm font-medium mb-1">
                    Ano
                  </label>
                  <select
                    id="filtro-ano"
                    value={filtrosBusca.ano}
                    onChange={(e) => handleFiltroChange("ano", e.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Todos os anos</option>
                    {valoresUnicos.anos.map((ano) => (
                      <option key={ano} value={ano}>
                        {ano}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filtro por Categoria */}
                <div className="lg:col-span-3">
                  <label htmlFor="filtro-categoria" className="block text-sm font-medium mb-1">
                    Categoria
                  </label>
                  <select
                    id="filtro-categoria"
                    value={filtrosBusca.categoria}
                    onChange={(e) => handleFiltroChange("categoria", e.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Todas as categorias</option>
                    {valoresUnicos.categorias.map((categoria) => (
                      <option key={categoria} value={categoria}>
                        {categoria === "carro" ? "Carro" : 
                         categoria === "moto" ? "Moto" : 
                         categoria === "caminhao" ? "Caminhão" : 
                         categoria === "van" ? "Van" : 
                         categoria === "onibus" ? "Ônibus" : 
                         categoria}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Indicador de resultados filtrados */}
              {temFiltrosAtivos && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2">
                  <Search className="h-4 w-4" />
                  <span>
                    {solicitacoesOrdenadas.length} {solicitacoesOrdenadas.length === 1 ? "solicitação encontrada" : "solicitações encontradas"}
                  </span>
                </div>
              )}
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

            {!loading && !error && solicitacoesOrdenadas.length === 0 && (
              <EmptyState
                title={
                  temFiltrosAtivos
                    ? "Nenhuma solicitação encontrada"
                    : filtroAtivo === "disponiveis"
                    ? "Nenhuma solicitação disponível"
                    : filtroAtivo === "atendidas"
                    ? "Nenhuma solicitação atendida"
                    : "Nenhuma solicitação vista"
                }
                message={
                  temFiltrosAtivos
                    ? "Não há solicitações que correspondam aos filtros aplicados. Tente ajustar os critérios de busca."
                    : filtroAtivo === "disponiveis"
                    ? "Não há solicitações disponíveis na sua cidade no momento. Continue acompanhando para novas oportunidades!"
                    : filtroAtivo === "atendidas"
                    ? "Você ainda não atendeu nenhuma solicitação. Comece a visualizar as solicitações disponíveis!"
                    : "Você ainda não marcou nenhuma solicitação como vista."
                }
                actionLabel={
                  temFiltrosAtivos
                    ? "Limpar Filtros"
                    : filtroAtivo === "atendidas" || filtroAtivo === "vistas"
                    ? "Ver Solicitações Disponíveis"
                    : undefined
                }
                onAction={
                  temFiltrosAtivos
                    ? limparFiltros
                    : filtroAtivo === "atendidas" || filtroAtivo === "vistas"
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
                      tipoUsuario="autopeca"
                      onAtender={filtroAtivo === "disponiveis" ? handleAtender : undefined}
                      onDesmarcar={filtroAtivo === "atendidas" ? handleDesmarcar : undefined}
                      onMarcarComoVista={filtroAtivo === "disponiveis" ? handleMarcarComoVista : undefined}
                      onDesmarcarComoVista={filtroAtivo === "vistas" ? handleDesmarcarComoVista : undefined}
                      showActions={true}
                    />
                    {filtroAtivo === "disponiveis" && atendendo === solicitacao.id && (
                      <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-lg z-10">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                          <p className="text-sm text-muted-foreground">Marcando como atendida...</p>
                        </div>
                      </div>
                    )}
                    {filtroAtivo === "disponiveis" && sucesso?.id === solicitacao.id && (
                      <div className="absolute top-4 right-4 bg-green-50 border border-green-200 rounded-lg p-3 z-10 flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        <p className="text-sm text-green-800">{sucesso.mensagem}</p>
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

export default DashboardAutopeca;
