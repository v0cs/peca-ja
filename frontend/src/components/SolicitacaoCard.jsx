import { Link } from "react-router-dom";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Badge } from "./ui";
import { MapPin, Calendar, Car, MessageCircle, CheckCircle, XCircle, Eye } from "lucide-react";

const SolicitacaoCard = ({ 
  solicitacao, 
  tipoUsuario = "cliente",
  onAtender,
  onMarcarConcluida,
  onDesmarcar,
  onMarcarComoVista,
  onDesmarcarComoVista,
  showActions = true 
}) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      ativa: { label: "Ativa", color: "bg-green-100 text-green-800" },
      concluida: { label: "Concluída", color: "bg-blue-100 text-blue-800" },
      cancelada: { label: "Cancelada", color: "bg-red-100 text-red-800" },
    };

    const config = statusConfig[status] || {
      label: status,
      color: "bg-gray-100 text-gray-800",
    };

    return (
      <Badge 
        variant="outline"
        className={config.color}
      >
        {config.label}
      </Badge>
    );
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <CardTitle className="text-lg">
                {solicitacao.descricao_peca || "Solicitação sem descrição"}
              </CardTitle>
              {getStatusBadge(solicitacao.status_cliente || solicitacao.status)}
            </div>
            <CardDescription className="flex items-center space-x-2 mt-1">
              <Car className="h-4 w-4" />
              <span>
                {solicitacao.marca} {solicitacao.modelo} {solicitacao.ano_fabricacao && `(${solicitacao.ano_fabricacao})`}
              </span>
              <span>•</span>
              <span>Placa: {solicitacao.placa || "Não informado"}</span>
            </CardDescription>
          </div>
          <div className="text-right text-sm text-muted-foreground">
            {formatDate(solicitacao.data_criacao || solicitacao.created_at)}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Categoria</p>
            <p className="text-sm font-medium capitalize">
              {solicitacao.categoria || "Não informado"}
            </p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-1 flex items-center">
              <MapPin className="h-3 w-3 mr-1" />
              Localização
            </p>
            <p className="text-sm font-medium">
              {solicitacao.cidade_atendimento || solicitacao.cidade}, {solicitacao.uf_atendimento || solicitacao.uf}
            </p>
          </div>
        </div>

        {showActions && (
          <div className="flex gap-2 pt-4 border-t flex-wrap">
            {tipoUsuario === "cliente" && (
              <>
                <Link to={`/solicitacoes/${solicitacao.id}`}>
                  <Button variant="outline" size="sm">
                    Ver Detalhes
                  </Button>
                </Link>
                {solicitacao.status_cliente === "ativa" && (
                  <>
                    <Link to={`/solicitacoes/${solicitacao.id}/editar`}>
                      <Button variant="ghost" size="sm">
                        Editar
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onMarcarConcluida && onMarcarConcluida(solicitacao)}
                      className="text-orange-600 border-orange-300 hover:bg-orange-50 hover:border-orange-400"
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Marcar como Concluída
                    </Button>
                  </>
                )}
              </>
            )}

            {tipoUsuario === "autopeca" && (
              <>
                <Link to={`/solicitacoes/${solicitacao.id}`}>
                  <Button variant="outline" size="sm">
                    Ver Detalhes
                  </Button>
                </Link>
                {solicitacao.status_cliente === "ativa" && onAtender && (
                  <Button
                    size="sm"
                    onClick={() => onAtender(solicitacao)}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Atender via WhatsApp
                  </Button>
                )}
                {solicitacao.status_cliente === "ativa" && onMarcarComoVista && (
                  <Button
                    size="sm"
                    onClick={() => onMarcarComoVista(solicitacao)}
                    variant="outline"
                    className="text-muted-foreground hover:bg-muted"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Marcar como Vista
                  </Button>
                )}
                {solicitacao.data_atendimento && onDesmarcar && (
                  <Button
                    size="sm"
                    onClick={() => onDesmarcar(solicitacao)}
                    variant="outline"
                    className="text-orange-600 border-orange-300 hover:bg-orange-50 hover:border-orange-400"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Desmarcar
                  </Button>
                )}
                {solicitacao.data_marcacao && onDesmarcarComoVista && (
                  <Button
                    size="sm"
                    onClick={() => onDesmarcarComoVista(solicitacao)}
                    variant="outline"
                    className="text-primary border-primary/20 hover:bg-primary/10"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Retornar ao Dashboard
                  </Button>
                )}
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SolicitacaoCard;

