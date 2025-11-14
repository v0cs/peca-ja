import { useState } from "react";
import { Button, Input } from "../ui";

const PasswordForm = ({ onSubmit, loading = false }) => {
  const [formValues, setFormValues] = useState({
    senha_atual: "",
    nova_senha: "",
    confirmar_senha: "",
  });
  const [errors, setErrors] = useState({});
  const [formFeedback, setFormFeedback] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setFormValues({
      senha_atual: "",
      nova_senha: "",
      confirmar_senha: "",
    });
    setErrors({});
  };

  const validate = () => {
    const newErrors = {};
    if (!formValues.senha_atual) {
      newErrors.senha_atual = "Informe sua senha atual";
    }
    if (!formValues.nova_senha) {
      newErrors.nova_senha = "Digite a nova senha";
    } else if (formValues.nova_senha.length < 6) {
      newErrors.nova_senha = "A nova senha deve ter pelo menos 6 caracteres";
    }

    if (!formValues.confirmar_senha) {
      newErrors.confirmar_senha = "Confirme a nova senha";
    } else if (formValues.confirmar_senha !== formValues.nova_senha) {
      newErrors.confirmar_senha = "As senhas não coincidem";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate() || loading || isSubmitting) return;

    setIsSubmitting(true);
    setFormFeedback(null);

    try {
      const result = (await onSubmit?.({
        senha_atual: formValues.senha_atual,
        nova_senha: formValues.nova_senha,
        confirmar_senha: formValues.confirmar_senha,
      })) || {};

      if (result.fieldErrors) {
        setErrors(result.fieldErrors);
      }

      if (result.success) {
        setFormFeedback({
          type: "success",
          message:
            result.message ||
            "Senha alterada com sucesso. Você será redirecionado para o login.",
        });
        resetForm();
      } else if (result.message) {
        setFormFeedback({
          type: "error",
          message: result.message,
        });
      }
    } catch (error) {
      const fieldErrors =
        error?.fieldErrors || error?.errors || error?.response?.data?.errors;
      if (fieldErrors) {
        setErrors(fieldErrors);
      }

      const message =
        error?.message ||
        error?.response?.data?.message ||
        "Não foi possível alterar a senha. Tente novamente.";

      setFormFeedback({
        type: "error",
        message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {formFeedback && (
        <div
          className={`rounded-md border px-4 py-3 text-sm ${
            formFeedback.type === "success"
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {formFeedback.message}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <Input
            label="Senha atual"
            id="senha_atual"
            name="senha_atual"
            type="password"
            value={formValues.senha_atual}
            onChange={handleChange}
            required
            error={errors.senha_atual}
            autoComplete="current-password"
            disabled={loading || isSubmitting}
          />
        </div>

        <div>
          <Input
            label="Nova senha"
            id="nova_senha"
            name="nova_senha"
            type="password"
            value={formValues.nova_senha}
            onChange={handleChange}
            required
            error={errors.nova_senha}
            autoComplete="new-password"
            disabled={loading || isSubmitting}
          />
        </div>

        <div>
          <Input
            label="Confirmar nova senha"
            id="confirmar_senha"
            name="confirmar_senha"
            type="password"
            value={formValues.confirmar_senha}
            onChange={handleChange}
            required
            error={errors.confirmar_senha}
            autoComplete="new-password"
            disabled={loading || isSubmitting}
          />
        </div>
      </div>

      <div>
        <Button
          type="submit"
          disabled={loading || isSubmitting}
        >
          {loading || isSubmitting ? "Salvando..." : "Alterar senha"}
        </Button>
        <p className="mt-2 text-sm text-gray-500">
          Por segurança, você será desconectado após alterar a senha.
        </p>
      </div>
    </form>
  );
};

export default PasswordForm;




