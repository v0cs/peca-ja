import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button, Input } from "../ui";
import { validarEmail } from "../../utils/validators";

/**
 * Formulário para cadastro e edição de vendedores
 * @param {Object} props
 * @param {Object} props.vendedor - Dados do vendedor para edição (null para cadastro)
 * @param {Function} props.onSubmit - Callback ao submeter formulário
 * @param {Function} props.onCancel - Callback ao cancelar
 * @param {boolean} props.loading - Estado de carregamento
 */
const VendedorForm = ({ vendedor, onSubmit, onCancel, loading = false }) => {
  const isEdicao = !!vendedor;

  const [formData, setFormData] = useState({
    nome: "",
    email: "",
  });

  const [errors, setErrors] = useState({});

  // Preencher formulário com dados do vendedor em modo de edição
  useEffect(() => {
    if (isEdicao && vendedor) {
      setFormData({
        nome: vendedor.nome_completo || "",
        email: vendedor.usuario?.email || "",
      });
    }
  }, [vendedor, isEdicao]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Limpar erro do campo ao digitar
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: null,
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Validar nome
    if (!formData.nome.trim()) {
      newErrors.nome = "Nome completo é obrigatório";
    } else if (formData.nome.trim().length < 2) {
      newErrors.nome = "Nome deve ter pelo menos 2 caracteres";
    }

      // Validar email (apenas em cadastro, não permite edição)
      if (!isEdicao) {
        if (!formData.email.trim()) {
          newErrors.email = "Email é obrigatório";
        } else if (!validarEmail(formData.email)) {
          newErrors.email = "Email inválido";
        }
      }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Preparar dados para envio
    // Backend espera "nome" no cadastro e "nome_completo" na edição
    const dadosParaEnvio = isEdicao
      ? {
          nome_completo: formData.nome.trim(), // Edição usa nome_completo
        }
      : {
          nome: formData.nome.trim(), // Cadastro usa nome
        };

    // Se não é edição, incluir email
    if (!isEdicao) {
      dadosParaEnvio.email = formData.email.toLowerCase().trim();
      // Senha sempre gerada automaticamente pelo backend
    }

    onSubmit(dadosParaEnvio);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">
            {isEdicao ? "Editar Vendedor" : "Cadastrar Novo Vendedor"}
          </h2>
          <button
            onClick={onCancel}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Nome Completo */}
          <Input
            label="Nome Completo"
            id="nome"
            name="nome"
            type="text"
            value={formData.nome}
            onChange={handleChange}
            error={errors.nome}
            placeholder="Ex: João Silva"
            disabled={loading}
            required
          />

          {/* Email (apenas em cadastro) */}
          {!isEdicao && (
            <Input
              label="Email"
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              placeholder="vendedor@exemplo.com"
              disabled={loading}
              required
            />
          )}

          {/* Email (modo edição - somente leitura) */}
          {isEdicao && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-600">
                {formData.email}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                O email não pode ser alterado
              </p>
            </div>
          )}

          {/* Informação sobre senha (apenas em cadastro) */}
          {!isEdicao && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <p className="text-sm text-blue-800">
                <strong>Senha automática:</strong> Uma senha temporária será gerada 
                automaticamente e enviada por email. O vendedor deverá trocá-la no 
                primeiro acesso.
              </p>
            </div>
          )}

          {/* Ações */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="default"
              disabled={loading}
              className="flex-1"
            >
              {loading
                ? "Salvando..."
                : isEdicao
                ? "Salvar Alterações"
                : "Cadastrar Vendedor"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VendedorForm;

