import { useState, useEffect, useCallback } from "react";
import { Input } from "../ui";
import LoadingSpinner from "../ui/LoadingSpinner";
import { AlertCircle, CheckCircle, X } from "lucide-react";
import api from "../../services/api";

const VehicleForm = ({ formData, onChange, errors }) => {
  const [consultandoPlaca, setConsultandoPlaca] = useState(false);
  const [consultaResultado, setConsultaResultado] = useState(null);
  const [erroConsulta, setErroConsulta] = useState(null);
  const [ultimaPlacaConsultada, setUltimaPlacaConsultada] = useState(null);

  // Função para normalizar placa (remover hífen e converter para maiúscula)
  const normalizarPlaca = useCallback((placa) => {
    if (!placa) return null;
    return placa.replace(/-/g, "").replace(/\s+/g, "").toUpperCase();
  }, []);

  // Função para validar formato da placa
  const validarFormatoPlaca = useCallback((placa) => {
    if (!placa || placa.length < 7) return false;
    // Formato Mercosul: ABC1D23 ou Antigo: ABC1234
    const placaRegex = /^[A-Z]{3}[0-9][0-9A-Z][0-9]{2}$|^[A-Z]{3}[0-9]{4}$/;
    return placaRegex.test(placa);
  }, []);

  // Função para consultar placa na API
  const consultarPlaca = useCallback(async (placa) => {
    if (!placa || placa.length < 7) {
      return;
    }

    // Normalizar placa antes de consultar
    const placaNormalizada = normalizarPlaca(placa);
    
    // Validar formato
    if (!validarFormatoPlaca(placaNormalizada)) {
      setErroConsulta(null);
      setConsultaResultado(null);
      return;
    }

    // Evitar consultas duplicadas
    if (ultimaPlacaConsultada === placaNormalizada) {
      return;
    }

    setConsultandoPlaca(true);
    setErroConsulta(null);
    setConsultaResultado(null);
    setUltimaPlacaConsultada(placaNormalizada);

    try {
      console.log(`🔍 [VehicleForm] Consultando placa: ${placaNormalizada}`);
      console.log(`🔍 [VehicleForm] URL: /vehicle/consulta/${placaNormalizada}`);
      console.log(`🔍 [VehicleForm] Token presente:`, !!localStorage.getItem("token"));
      
      const response = await api.get(`/vehicle/consulta/${placaNormalizada}`);
      
      console.log(`✅ [VehicleForm] Resposta da API recebida:`, response.status, response.data);
      
      if (response.data.success && response.data.data?.veiculo) {
        const veiculo = response.data.data.veiculo;
        
        console.log(`📦 Dados do veículo recebidos:`, veiculo);
        console.log(`📦 Origem dos dados:`, veiculo.origem_dados_veiculo);
        
        // Verificar se os dados são de fallback (valores padrão "Não informado")
        // Se a origem é fallback ou se todos os campos importantes estão como "Não informado", significa que a API falhou
        const isFallback = 
          veiculo.origem_dados_veiculo === "manual" || 
          veiculo.origem_dados_veiculo === "fallback" ||
          veiculo.origem_dados_veiculo === "api_com_fallback" ||
          (veiculo.marca === "Não informado" && 
           veiculo.modelo === "Não informado" &&
           veiculo.cor === "Não informado");
        
        if (isFallback) {
          console.warn(`⚠️ [VehicleForm] Dados são de fallback, API não conseguiu trazer informações`);
          
          // Limpar campos e mostrar erro
          onChange({
            target: {
              name: "marca",
              value: "",
            },
          });
          onChange({
            target: {
              name: "modelo",
              value: "",
            },
          });
          onChange({
            target: {
              name: "ano_fabricacao",
              value: "",
            },
          });
          onChange({
            target: {
              name: "ano_modelo",
              value: "",
            },
          });
          onChange({
            target: {
              name: "categoria",
              value: "",
            },
          });
          onChange({
            target: {
              name: "cor",
              value: "",
            },
          });
          
          const errorMessage = "Não foi possível consultar a placa automaticamente. Preencha os dados do veículo manualmente.";
          setErroConsulta(errorMessage);
          setConsultaResultado({
            sucesso: false,
            mensagem: errorMessage,
          });
          
          // Limpar mensagem de erro após 10 segundos
          setTimeout(() => {
            setErroConsulta(null);
            setConsultaResultado(null);
          }, 10000);
          
          return;
        }
        
        // Preencher formulário com dados válidos da API
        onChange({
          target: {
            name: "marca",
            value: veiculo.marca || "",
          },
        });
        onChange({
          target: {
            name: "modelo",
            value: veiculo.modelo || "",
          },
        });
        onChange({
          target: {
            name: "ano_fabricacao",
            value: veiculo.ano_fabricacao || "",
          },
        });
        onChange({
          target: {
            name: "ano_modelo",
            value: veiculo.ano_modelo || veiculo.ano_fabricacao || "",
          },
        });
        onChange({
          target: {
            name: "categoria",
            value: veiculo.categoria || "",
          },
        });
        onChange({
          target: {
            name: "cor",
            value: veiculo.cor || "",
          },
        });

        setConsultaResultado({
          sucesso: true,
          origem: veiculo.origem_dados_veiculo || "api",
          mensagem: "Dados do veículo preenchidos automaticamente",
        });

        // Limpar mensagem de sucesso após 5 segundos
        setTimeout(() => {
          setConsultaResultado(null);
        }, 5000);
      } else {
        throw new Error("Resposta da API não contém dados do veículo");
      }
    } catch (error) {
      console.error(`❌ [VehicleForm] Erro ao consultar placa:`, {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText,
        url: error.config?.url,
        baseURL: error.config?.baseURL,
      });
      
      let message = "Não foi possível consultar a placa automaticamente. Preencha os dados do veículo manualmente.";
      
      if (error.response?.status === 401) {
        message = "Você precisa estar autenticado para consultar a placa";
      } else if (error.response?.status === 400) {
        message = error.response?.data?.message || "Formato de placa inválido";
      } else if (error.response?.status === 429) {
        message = "Muitas consultas. Aguarde um momento e tente novamente";
      } else if (error.response?.status === 404) {
        message = "Placa não encontrada. Preencha os dados do veículo manualmente.";
      } else if (error.response?.data?.message) {
        message = error.response.data.message;
      } else if (error.message) {
        message = error.message;
      }
      
      // LIMPAR TODOS OS CAMPOS DO VEÍCULO quando a API falhar
      onChange({
        target: {
          name: "marca",
          value: "",
        },
      });
      onChange({
        target: {
          name: "modelo",
          value: "",
        },
      });
      onChange({
        target: {
          name: "ano_fabricacao",
          value: "",
        },
      });
      onChange({
        target: {
          name: "ano_modelo",
          value: "",
        },
      });
      onChange({
        target: {
          name: "categoria",
          value: "",
        },
      });
      onChange({
        target: {
          name: "cor",
          value: "",
        },
      });
      
      setErroConsulta(message);
      setConsultaResultado({
        sucesso: false,
        mensagem: message,
      });

      // Limpar mensagem de erro após 10 segundos (dar tempo para o usuário ler)
      setTimeout(() => {
        setErroConsulta(null);
        setConsultaResultado(null);
      }, 10000);
    } finally {
      setConsultandoPlaca(false);
    }
  }, [normalizarPlaca, validarFormatoPlaca, ultimaPlacaConsultada, onChange]);

  // Debounce para consulta de placa
  useEffect(() => {
    const placa = formData.placa;
    
    // Se a placa foi apagada completamente, apenas resetar estado de consulta
    // (não limpar campos para não perder dados caso usuário esteja apenas editando a placa)
    if (!placa || placa.trim().length === 0) {
      setErroConsulta(null);
      setConsultaResultado(null);
      setUltimaPlacaConsultada(null);
      return;
    }

    // Normalizar placa
    const placaNormalizada = normalizarPlaca(placa);
    
    // Validar formato básico (pelo menos 7 caracteres)
    if (!placaNormalizada || placaNormalizada.length < 7) {
      setErroConsulta(null);
      setConsultaResultado(null);
      return;
    }

    // Aguardar usuário terminar de digitar (debounce de 1 segundo)
    const timer = setTimeout(() => {
      // Validar formato completo antes de consultar
      if (validarFormatoPlaca(placaNormalizada)) {
        consultarPlaca(placaNormalizada);
      } else {
        // Se a placa não está completa ainda, aguardar mais
        if (placaNormalizada.length === 7) {
          // Placa tem 7 caracteres mas formato inválido
          setErroConsulta("Formato de placa inválido. Use ABC-1234 ou ABC1D23");
        }
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [formData.placa, normalizarPlaca, validarFormatoPlaca, consultarPlaca]);

  const formatarPlaca = (value) => {
    // Remove tudo que não é letra/número
    let placa = value.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
    
    // Limita a 7 caracteres
    placa = placa.slice(0, 7);
    
    // Formata: ABC1234 ou ABC1D23 (Mercosul)
    if (placa.length > 0) {
      // Formato Mercosul (3 letras + 1 número + 1 letra/número + 2 números)
      // Padrão: ABC1D23
      if (placa.length > 4 && /^[A-Z]{3}[0-9][A-Z0-9]/.test(placa)) {
        // Não adiciona hífen no formato Mercosul
        return placa;
      }
      // Formato antigo (3 letras + 4 números)
      if (placa.length > 3) {
        return `${placa.slice(0, 3)}-${placa.slice(3)}`;
      }
    }
    
    return placa;
  };

  const handlePlacaChange = (e) => {
    const formatted = formatarPlaca(e.target.value);
    onChange({
      target: {
        name: "placa",
        value: formatted,
      },
    });
    
    // Resetar estado de consulta quando placa mudar significativamente
    const placaAnterior = ultimaPlacaConsultada;
    const placaNova = normalizarPlaca(formatted);
    
    // Se a placa mudou significativamente (não é apenas correção de formatação)
    if (placaAnterior && placaAnterior !== placaNova) {
      setUltimaPlacaConsultada(null);
      setConsultaResultado(null);
      setErroConsulta(null);
      
      // Limpar campos do veículo quando placa mudar
      // A consulta automática vai preencher se der certo
      onChange({
        target: {
          name: "marca",
          value: "",
        },
      });
      onChange({
        target: {
          name: "modelo",
          value: "",
        },
      });
      onChange({
        target: {
          name: "ano_fabricacao",
          value: "",
        },
      });
      onChange({
        target: {
          name: "ano_modelo",
          value: "",
        },
      });
      onChange({
        target: {
          name: "categoria",
          value: "",
        },
      });
      onChange({
        target: {
          name: "cor",
          value: "",
        },
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Input
          label="Placa do Veículo"
          id="placa"
          name="placa"
          value={formData.placa || ""}
          onChange={handlePlacaChange}
          placeholder="ABC-1234 ou ABC1D23"
          required
          error={errors.placa}
          maxLength={8}
        />
        <p className="text-xs text-muted-foreground mt-1">
          Digite a placa para preenchimento automático dos dados do veículo
        </p>
      </div>

      {/* Status da Consulta */}
      {consultandoPlaca && (
        <div className="flex items-center gap-2 p-3 bg-primary/10 border border-primary/20 rounded-lg">
          <LoadingSpinner size="sm" />
          <span className="text-sm text-primary">Consultando dados do veículo...</span>
        </div>
      )}

      {consultaResultado?.sucesso && (
        <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-sm text-green-800">
              {consultaResultado.mensagem}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setConsultaResultado(null)}
            className="text-green-600 hover:text-green-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Mensagem de Erro - mostra apenas uma mensagem quando há erro */}
      {(erroConsulta || (consultaResultado && !consultaResultado.sucesso)) && !consultandoPlaca && (
        <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 flex-1">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
            <span className="text-sm text-red-800">
              {erroConsulta || consultaResultado?.mensagem || "Erro ao consultar placa"}
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setErroConsulta(null);
              setConsultaResultado(null);
            }}
            className="text-red-600 hover:text-red-800 flex-shrink-0 ml-2"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Campos do Veículo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Marca"
          id="marca"
          name="marca"
          value={formData.marca || ""}
          onChange={onChange}
          required
          error={errors.marca}
        />

        <Input
          label="Modelo"
          id="modelo"
          name="modelo"
          value={formData.modelo || ""}
          onChange={onChange}
          required
          error={errors.modelo}
        />

        <Input
          label="Ano de Fabricação"
          id="ano_fabricacao"
          name="ano_fabricacao"
          type="number"
          value={formData.ano_fabricacao || ""}
          onChange={onChange}
          required
          error={errors.ano_fabricacao}
          min="1900"
          max={new Date().getFullYear() + 1}
        />

        <Input
          label="Ano do Modelo"
          id="ano_modelo"
          name="ano_modelo"
          type="number"
          value={formData.ano_modelo || ""}
          onChange={onChange}
          required
          error={errors.ano_modelo}
          min="1900"
          max={new Date().getFullYear() + 1}
        />

        <div>
          <label htmlFor="categoria" className="block text-sm font-medium mb-1">
            Categoria <span className="text-destructive">*</span>
          </label>
          <select
            id="categoria"
            name="categoria"
            value={formData.categoria || ""}
            onChange={onChange}
            required
            className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Selecione...</option>
            <option value="carro">Carro</option>
            <option value="moto">Moto</option>
            <option value="caminhao">Caminhão</option>
            <option value="van">Van</option>
            <option value="onibus">Ônibus</option>
            <option value="outro">Outro</option>
          </select>
          {errors.categoria && (
            <p className="text-sm text-destructive mt-1">{errors.categoria}</p>
          )}
        </div>

        <Input
          label="Cor"
          id="cor"
          name="cor"
          value={formData.cor || ""}
          onChange={onChange}
          required
          error={errors.cor}
        />
      </div>
    </div>
  );
};

export default VehicleForm;
