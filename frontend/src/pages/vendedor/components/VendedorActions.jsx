import { Link } from "react-router-dom";
import { Button } from "../../../components/ui";
import { Eye, MessageCircle, RotateCcw, Undo2 } from "lucide-react";

const VendedorActions = ({
  solicitacao,
  contexto = "disponiveis",
  onAtender,
  onMarcarComoVista,
  onRetornarDashboard,
  onDesmarcarAtendida,
  processando = false,
  processandoTipo = null,
}) => {
  const estaProcessando = (tipo) =>
    processando && (!tipo || processandoTipo === tipo);

  const podeAtender =
    typeof onAtender === "function" &&
    solicitacao.status_cliente === "ativa" &&
    contexto !== "atendidas";

  return (
    <>
      <Link to={`/solicitacoes/${solicitacao.id}`}>
        <Button variant="outline" size="sm">
          Ver Detalhes
        </Button>
      </Link>

      {podeAtender && (
        <Button
          size="sm"
          onClick={() => onAtender(solicitacao)}
          disabled={estaProcessando("atender")}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          <MessageCircle className="mr-2 h-4 w-4" />
          {contexto === "vistas" ? "Atender agora" : "Atender via WhatsApp"}
        </Button>
      )}

      {contexto === "disponiveis" && typeof onMarcarComoVista === "function" && (
        <Button
          size="sm"
          variant="outline"
          className="text-muted-foreground hover:bg-muted"
          onClick={() => onMarcarComoVista(solicitacao)}
          disabled={estaProcessando("marcar_vista")}
        >
          <Eye className="mr-2 h-4 w-4" />
          Marcar como Vista
        </Button>
      )}

      {contexto === "vistas" &&
        typeof onRetornarDashboard === "function" && (
          <Button
            size="sm"
            variant="outline"
            className="text-primary border-primary/20 hover:bg-primary/10"
            onClick={() => onRetornarDashboard(solicitacao)}
            disabled={estaProcessando("desmarcar_vista")}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Retornar ao Dashboard
          </Button>
        )}

      {contexto === "atendidas" &&
        typeof onDesmarcarAtendida === "function" && (
          <Button
            size="sm"
            variant="outline"
            className="text-orange-600 border-orange-300 hover:bg-orange-50 hover:border-orange-400"
            onClick={() => onDesmarcarAtendida(solicitacao)}
            disabled={estaProcessando("desmarcar_atendida")}
          >
            <Undo2 className="mr-2 h-4 w-4" />
            Reabrir Solicitação
          </Button>
        )}
    </>
  );
};

export default VendedorActions;


