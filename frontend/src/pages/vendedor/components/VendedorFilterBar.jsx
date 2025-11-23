import { Search, X as XIcon } from "lucide-react";
import { Input, Button } from "../../../components/ui";

const rotulosCategoria = {
  carro: "Carro",
  moto: "Moto",
  caminhao: "Caminhão",
  van: "Van",
  onibus: "Ônibus",
  outro: "Outro",
};

const VendedorFilterBar = ({
  filtros,
  onFiltroChange,
  onLimparFiltros,
  valoresUnicos,
  temFiltrosAtivos,
  quantidadeResultados,
}) => {
  return (
    <div className="space-y-4 pt-4 border-t">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-3">
          <Input
            label="Buscar por palavra-chave"
            id="palavra-chave"
            type="text"
            placeholder="Digite palavras-chave (descrição, marca, modelo)..."
            value={filtros.palavraChave}
            onChange={(e) => onFiltroChange("palavraChave", e.target.value)}
            className="w-full"
          />
        </div>

        <div>
          <label htmlFor="filtro-marca" className="block text-sm font-medium mb-1">
            Marca
          </label>
          <select
            id="filtro-marca"
            value={filtros.marca}
            onChange={(e) => onFiltroChange("marca", e.target.value)}
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

        <div>
          <label htmlFor="filtro-modelo" className="block text-sm font-medium mb-1">
            Modelo
          </label>
          <select
            id="filtro-modelo"
            value={filtros.modelo}
            onChange={(e) => onFiltroChange("modelo", e.target.value)}
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

        <div>
          <label htmlFor="filtro-ano" className="block text-sm font-medium mb-1">
            Ano
          </label>
          <select
            id="filtro-ano"
            value={filtros.ano}
            onChange={(e) => onFiltroChange("ano", e.target.value)}
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

        <div className="lg:col-span-3">
          <label
            htmlFor="filtro-categoria"
            className="block text-sm font-medium mb-1"
          >
            Categoria
          </label>
          <select
            id="filtro-categoria"
            value={filtros.categoria}
            onChange={(e) => onFiltroChange("categoria", e.target.value)}
            className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Todas as categorias</option>
            {valoresUnicos.categorias.map((categoria) => (
              <option key={categoria} value={categoria}>
                {rotulosCategoria[categoria] || categoria}
              </option>
            ))}
          </select>
        </div>
      </div>

      {temFiltrosAtivos && (
        <div className="flex items-center justify-between gap-3 flex-wrap pt-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Search className="h-4 w-4" />
            <span>
              {quantidadeResultados}{" "}
              {quantidadeResultados === 1
                ? "solicitação encontrada"
                : "solicitações encontradas"}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onLimparFiltros}
            className="text-muted-foreground"
          >
            <XIcon className="mr-2 h-4 w-4" />
            Limpar filtros
          </Button>
        </div>
      )}
    </div>
  );
};

export default VendedorFilterBar;
















