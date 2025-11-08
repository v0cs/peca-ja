import { useState } from "react";
import { Mail, Calendar, Edit, Trash2, MoreVertical, RefreshCw } from "lucide-react";
import { Button, Card, CardContent } from "../ui";
import StatusBadge from "./StatusBadge";

/**
 * Card para exibir informações de um vendedor
 * @param {Object} props
 * @param {Object} props.vendedor - Dados do vendedor
 * @param {Function} props.onEditar - Callback para editar vendedor
 * @param {Function} props.onInativar - Callback para inativar vendedor
 * @param {Function} props.onReativar - Callback para reativar vendedor
 */
const VendedorCard = ({ vendedor, onEditar, onInativar, onReativar }) => {
  const [showMenu, setShowMenu] = useState(false);

  const formatarData = (dataString) => {
    if (!dataString) return "Data não disponível";

    try {
      const data = new Date(dataString);
      return data.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return "Data inválida";
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {/* Nome e Status */}
            <div className="flex items-center gap-3 mb-3">
              <h3 className="text-lg font-semibold text-foreground">
                {vendedor.nome_completo}
              </h3>
              <StatusBadge ativo={vendedor.ativo} />
            </div>

            {/* Email */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Mail className="h-4 w-4" />
              <span>{vendedor.usuario?.email || "Email não disponível"}</span>
            </div>

            {/* Data de Cadastro */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                Cadastrado em {formatarData(vendedor.created_at)}
              </span>
            </div>
          </div>

          {/* Menu de Ações */}
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMenu(!showMenu)}
              className="h-8 w-8 p-0"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>

            {showMenu && (
              <>
                {/* Overlay para fechar menu ao clicar fora */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />

                {/* Menu Dropdown */}
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-20 border border-gray-200">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onEditar(vendedor);
                      }}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                      Editar
                    </button>

                    {vendedor.ativo && (
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          onInativar(vendedor);
                        }}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                        Inativar
                      </button>
                    )}

                    {!vendedor.ativo && onReativar && (
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          onReativar(vendedor);
                        }}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-green-700 hover:bg-green-50 transition-colors"
                      >
                        <RefreshCw className="h-4 w-4" />
                        Reativar
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VendedorCard;

