import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { UserPlus, RefreshCw, Search, Users, CheckCircle, XCircle, ArrowLeft } from "lucide-react";
import { Header } from "../components/layout";
import { Button, StatsCard, Card, CardContent, CardHeader, CardTitle, Input, EmptyState } from "../components/ui";
import { useVendedores } from "../hooks";
import VendedorCard from "../components/vendedores/VendedorCard";
import VendedorForm from "../components/vendedores/VendedorForm";
import ConfirmModal from "../components/modals/ConfirmModal";

const GerenciarVendedores = () => {
  const navigate = useNavigate();

  // Estados
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [vendedorEditando, setVendedorEditando] = useState(null);
  const [mostrarModalConfirmacao, setMostrarModalConfirmacao] = useState(false);
  const [vendedorParaInativar, setVendedorParaInativar] = useState(null);
  const [mostrarModalReativacao, setMostrarModalReativacao] = useState(false);
  const [vendedorParaReativar, setVendedorParaReativar] = useState(null);
  const [filtroStatus, setFiltroStatus] = useState("todos"); // "todos", "ativos", "inativos"
  const [buscaTexto, setBuscaTexto] = useState("");
  const [sucessoMensagem, setSucessoMensagem] = useState(null);

  // Hook de vendedores
  const {
    vendedores,
    loading,
    error,
    stats,
    criarVendedor,
    atualizarVendedor,
    inativarVendedor,
    reativarVendedor,
    refetch,
  } = useVendedores(true);

  // Filtrar vendedores
  const vendedoresFiltrados = useMemo(() => {
    let resultado = vendedores;

    // Filtro por status
    if (filtroStatus === "ativos") {
      resultado = resultado.filter((v) => v.ativo);
    } else if (filtroStatus === "inativos") {
      resultado = resultado.filter((v) => !v.ativo);
    }

    // Filtro por busca
    if (buscaTexto.trim()) {
      const busca = buscaTexto.toLowerCase().trim();
      resultado = resultado.filter((v) => {
        const nomeMatch = v.nome_completo?.toLowerCase().includes(busca);
        const emailMatch = v.usuario?.email?.toLowerCase().includes(busca);
        return nomeMatch || emailMatch;
      });
    }

    return resultado;
  }, [vendedores, filtroStatus, buscaTexto]);

  // Handlers
  const handleAbrirFormularioCadastro = () => {
    setVendedorEditando(null);
    setMostrarFormulario(true);
  };

  const handleAbrirFormularioEdicao = (vendedor) => {
    setVendedorEditando(vendedor);
    setMostrarFormulario(true);
  };

  const handleFecharFormulario = () => {
    setMostrarFormulario(false);
    setVendedorEditando(null);
  };

  const handleSubmitFormulario = async (dadosVendedor) => {
    try {
      let resultado;

      if (vendedorEditando) {
        // Edição
        resultado = await atualizarVendedor(vendedorEditando.id, dadosVendedor);
      } else {
        // Cadastro
        resultado = await criarVendedor(dadosVendedor);
      }

      if (resultado.success) {
        // Mostrar mensagem de sucesso
        setSucessoMensagem({
          tipo: "success",
          texto: resultado.message,
          credenciais: resultado.data?.credenciais,
        });

        // Fechar formulário
        handleFecharFormulario();

        // Esconder mensagem após 10 segundos (mais tempo se tiver credenciais)
        setTimeout(() => {
          setSucessoMensagem(null);
        }, resultado.data?.credenciais ? 15000 : 5000);
      } else {
        // Fechar formulário e deixar a mensagem de erro ser exibida no frontend
        // A mensagem de erro já está sendo setada pelo hook useVendedores
        handleFecharFormulario();
      }
    } catch (err) {
      console.error("Erro ao salvar vendedor:", err);
      // Fechar formulário e deixar a mensagem de erro ser exibida no frontend
      // A mensagem de erro já está sendo setada pelo hook useVendedores
      handleFecharFormulario();
    }
  };

  const handleAbrirModalInativacao = (vendedor) => {
    setVendedorParaInativar(vendedor);
    setMostrarModalConfirmacao(true);
  };

  const handleFecharModalInativacao = () => {
    setMostrarModalConfirmacao(false);
    setVendedorParaInativar(null);
  };

  const handleConfirmarInativacao = async () => {
    if (!vendedorParaInativar) return;

    try {
      const resultado = await inativarVendedor(vendedorParaInativar.id);

      if (resultado.success) {
        setSucessoMensagem({
          tipo: "success",
          texto: resultado.message,
        });

        handleFecharModalInativacao();

        setTimeout(() => {
          setSucessoMensagem(null);
        }, 5000);
      } else {
        alert(resultado.message || "Erro ao inativar vendedor");
      }
    } catch (err) {
      console.error("Erro ao inativar vendedor:", err);
      alert("Erro ao inativar vendedor. Tente novamente.");
    }
  };

  const handleAbrirModalReativacao = (vendedor) => {
    setVendedorParaReativar(vendedor);
    setMostrarModalReativacao(true);
  };

  const handleFecharModalReativacao = () => {
    setMostrarModalReativacao(false);
    setVendedorParaReativar(null);
  };

  const handleConfirmarReativacao = async () => {
    if (!vendedorParaReativar) return;

    try {
      const resultado = await reativarVendedor(vendedorParaReativar.id);

      if (resultado.success) {
        setSucessoMensagem({
          tipo: "success",
          texto: resultado.message,
        });

        handleFecharModalReativacao();

        setTimeout(() => {
          setSucessoMensagem(null);
        }, 5000);
      } else {
        // Fechar modal e deixar a mensagem de erro ser exibida no frontend
        // A mensagem de erro já está sendo setada pelo hook useVendedores
        handleFecharModalReativacao();
      }
    } catch (err) {
      console.error("Erro ao reativar vendedor:", err);
      // Fechar modal e deixar a mensagem de erro ser exibida no frontend
      // A mensagem de erro já está sendo setada pelo hook useVendedores
      handleFecharModalReativacao();
    }
  };

  const handleLimparFiltros = () => {
    setFiltroStatus("todos");
    setBuscaTexto("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-card/50">
      <Header />

      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/dashboard/autopeca")}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
              </div>
              <h1 className="text-3xl font-bold">Gerenciar Vendedores</h1>
              <p className="text-muted-foreground mt-2">
                Gerencie sua equipe de vendedores e controle o acesso à plataforma
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={refetch} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                Atualizar
              </Button>
              <Button variant="default" onClick={handleAbrirFormularioCadastro}>
                <UserPlus className="h-4 w-4 mr-2" />
                Adicionar Vendedor
              </Button>
            </div>
          </div>
        </div>

        {/* Mensagem de Sucesso */}
        {sucessoMensagem && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-green-800 font-medium">{sucessoMensagem.texto}</p>
                {sucessoMensagem.credenciais && (
                  <div className="mt-2 space-y-1 text-sm text-green-800">
                    <p className="font-semibold">Credenciais de acesso:</p>
                    <p>
                      <strong>Email:</strong> {sucessoMensagem.credenciais.email}
                    </p>
                    {sucessoMensagem.credenciais.senha_temporaria && (
                      <p>
                        <strong>Senha:</strong> {sucessoMensagem.credenciais.senha_temporaria}
                      </p>
                    )}
                    <p className="text-xs text-green-700 mt-1">
                      {sucessoMensagem.credenciais.mensagem}
                    </p>
                  </div>
                )}
              </div>
              <button
                onClick={() => setSucessoMensagem(null)}
                className="text-green-600 hover:text-green-800 flex-shrink-0"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <StatsCard
            title="Total de Vendedores"
            value={stats.total}
            subtitle="Cadastrados na plataforma"
            icon={<Users className="h-4 w-4" />}
          />
          <StatsCard
            title="Vendedores Ativos"
            value={stats.ativos}
            subtitle="Com acesso liberado"
            icon={<CheckCircle className="h-4 w-4 text-green-600" />}
          />
          <StatsCard
            title="Vendedores Inativos"
            value={stats.inativos}
            subtitle="Com acesso bloqueado"
            icon={<XCircle className="h-4 w-4 text-red-600" />}
          />
        </div>

        {/* Filtros e Busca */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {/* Busca por Nome/Email */}
              <div className="md:col-span-2">
                <Input
                  label="Buscar por nome ou email"
                  id="busca"
                  type="text"
                  placeholder="Digite o nome ou email do vendedor..."
                  value={buscaTexto}
                  onChange={(e) => setBuscaTexto(e.target.value)}
                  icon={<Search className="h-4 w-4" />}
                />
              </div>

              {/* Filtro por Status */}
              <div>
                <label className="block text-sm font-medium mb-2">Status</label>
                <div className="flex gap-2">
                  <Button
                    variant={filtroStatus === "todos" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFiltroStatus("todos")}
                  >
                    Todos ({stats.total})
                  </Button>
                  <Button
                    variant={filtroStatus === "ativos" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFiltroStatus("ativos")}
                  >
                    Ativos ({stats.ativos})
                  </Button>
                  <Button
                    variant={filtroStatus === "inativos" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFiltroStatus("inativos")}
                  >
                    Inativos ({stats.inativos})
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Vendedores */}
        <Card>
          <CardHeader>
            <CardTitle>
              Vendedores ({vendedoresFiltrados.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading && (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            )}

            {!loading && vendedoresFiltrados.length === 0 && (
              <EmptyState
                title="Nenhum vendedor encontrado"
                message={
                  buscaTexto || filtroStatus !== "todos"
                    ? "Não há vendedores que correspondam aos filtros aplicados."
                    : "Você ainda não cadastrou nenhum vendedor. Clique no botão 'Adicionar Vendedor' para começar."
                }
                actionLabel={
                  buscaTexto || filtroStatus !== "todos"
                    ? "Limpar Filtros"
                    : "Adicionar Vendedor"
                }
                onAction={
                  buscaTexto || filtroStatus !== "todos"
                    ? handleLimparFiltros
                    : handleAbrirFormularioCadastro
                }
              />
            )}

            {!loading && vendedoresFiltrados.length > 0 && (
              <div className="space-y-4">
                {vendedoresFiltrados.map((vendedor) => (
                  <VendedorCard
                    key={vendedor.id}
                    vendedor={vendedor}
                    onEditar={handleAbrirFormularioEdicao}
                    onInativar={handleAbrirModalInativacao}
                    onReativar={handleAbrirModalReativacao}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Formulário de Cadastro/Edição */}
      {mostrarFormulario && (
        <VendedorForm
          vendedor={vendedorEditando}
          onSubmit={handleSubmitFormulario}
          onCancel={handleFecharFormulario}
          loading={loading}
        />
      )}

      {/* Modal de Confirmação de Inativação */}
      <ConfirmModal
        isOpen={mostrarModalConfirmacao}
        onClose={handleFecharModalInativacao}
        onConfirm={handleConfirmarInativacao}
        title="Inativar Vendedor"
        message={`Tem certeza que deseja inativar o vendedor ${vendedorParaInativar?.nome_completo}? O acesso à plataforma será bloqueado.`}
        confirmText="Inativar"
        cancelText="Cancelar"
        variant="destructive"
        loading={loading}
      />

      {/* Modal de Confirmação de Reativação */}
      <ConfirmModal
        isOpen={mostrarModalReativacao}
        onClose={handleFecharModalReativacao}
        onConfirm={handleConfirmarReativacao}
        title="Reativar Vendedor"
        message={`Tem certeza que deseja reativar o vendedor ${vendedorParaReativar?.nome_completo}? O acesso à plataforma será liberado novamente.`}
        confirmText="Reativar"
        cancelText="Cancelar"
        variant="default"
        loading={loading}
      />
    </div>
  );
};

export default GerenciarVendedores;
