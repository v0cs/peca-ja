import { Badge } from "../ui";

const SolicitationStatus = ({ status }) => {
  const statusConfig = {
    ativa: {
      label: "Ativa",
      variant: "default",
      className: "bg-green-100 text-green-800 border-green-200",
    },
    concluida: {
      label: "Concluída",
      variant: "secondary",
      className: "bg-blue-100 text-blue-800 border-blue-200",
    },
    cancelada: {
      label: "Cancelada",
      variant: "destructive",
      className: "bg-red-100 text-red-800 border-red-200",
    },
  };

  const config = statusConfig[status] || {
    label: status || "Desconhecido",
    variant: "outline",
    className: "bg-gray-100 text-gray-800 border-gray-200",
  };

  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
};

export default SolicitationStatus;



