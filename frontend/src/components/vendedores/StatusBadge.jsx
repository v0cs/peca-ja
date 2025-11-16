import { CheckCircle, XCircle } from "lucide-react";

/**
 * Badge para exibir status ativo/inativo de vendedores
 * @param {Object} props
 * @param {boolean} props.ativo - Se o vendedor está ativo
 * @param {string} props.className - Classes CSS adicionais
 */
const StatusBadge = ({ ativo, className = "" }) => {
  if (ativo) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200 ${className}`}
      >
        <CheckCircle className="h-3 w-3" />
        Ativo
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200 ${className}`}
    >
      <XCircle className="h-3 w-3" />
      Inativo
    </span>
  );
};

export default StatusBadge;









