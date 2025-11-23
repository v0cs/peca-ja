import { Clock, CheckCircle, Eye, Award } from "lucide-react";
import { StatsCard } from "../../../components/ui";

const VendedorStats = ({
  cidade,
  stats = { disponiveis: 0, atendidas: 0, vistas: 0 },
  atendimentosHoje = 0,
  totalAtendimentos = 0,
}) => {
  return (
    <div className="grid md:grid-cols-4 gap-6 mb-8">
      <StatsCard
        title="Solicitações Disponíveis"
        value={stats.disponiveis}
        subtitle={
          cidade ? `Na cidade de ${cidade}` : "Disponíveis para você atuar"
        }
        icon={<Clock className="h-4 w-4" />}
      />
      <StatsCard
        title="Solicitações Vistas"
        value={stats.vistas}
        subtitle="Você pode retomá-las quando quiser"
        icon={<Eye className="h-4 w-4" />}
      />
      <StatsCard
        title="Atendidas Hoje"
        value={atendimentosHoje}
        subtitle="Atendimentos concluídos nas últimas 24h"
        icon={<Award className="h-4 w-4" />}
      />
      <StatsCard
        title="Total Atendidas"
        value={totalAtendimentos}
        subtitle="Histórico de solicitações que você atendeu"
        icon={<CheckCircle className="h-4 w-4" />}
      />
    </div>
  );
};

export default VendedorStats;
















