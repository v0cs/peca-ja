import { AlertTriangle, X } from "lucide-react";
import { Button } from "../ui";

/**
 * Modal de confirmação para ações destrutivas
 * @param {Object} props
 * @param {boolean} props.isOpen - Se o modal está aberto
 * @param {Function} props.onClose - Callback ao fechar
 * @param {Function} props.onConfirm - Callback ao confirmar
 * @param {string} props.title - Título do modal
 * @param {string} props.message - Mensagem de confirmação
 * @param {string} props.confirmText - Texto do botão de confirmação
 * @param {string} props.cancelText - Texto do botão de cancelar
 * @param {string} props.variant - Variante do botão de confirmação (default, destructive)
 * @param {boolean} props.loading - Estado de carregamento
 */
const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirmar ação",
  message = "Tem certeza que deseja realizar esta ação?",
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  variant = "destructive",
  loading = false,
}) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div
              className={`flex items-center justify-center h-10 w-10 rounded-full ${
                variant === "destructive"
                  ? "bg-red-100"
                  : "bg-yellow-100"
              }`}
            >
              <AlertTriangle
                className={`h-5 w-5 ${
                  variant === "destructive"
                    ? "text-red-600"
                    : "text-yellow-600"
                }`}
              />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Message */}
        <div className="p-6">
          <p className="text-gray-600 leading-relaxed">{message}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-6 pt-0">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="flex-1"
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            variant={variant === "destructive" ? "destructive" : "default"}
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1"
          >
            {loading ? "Processando..." : confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;














