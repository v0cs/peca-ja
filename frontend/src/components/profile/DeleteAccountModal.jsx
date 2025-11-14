import { useEffect, useState } from "react";
import { Button, Input } from "../ui";

const DeleteAccountModal = ({
  isOpen,
  onClose,
  onConfirm,
  loading = false,
}) => {
  const [confirmText, setConfirmText] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setConfirmText("");
      setPassword("");
      setError("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = async (event) => {
    event.preventDefault();
    if (loading) return;

    if (confirmText.trim().toUpperCase() !== "CONFIRMAR") {
      setError('Você deve digitar "CONFIRMAR" exatamente como solicitado.');
      return;
    }

    if (!password) {
      setError("Informe sua senha para continuar.");
      return;
    }

    setError("");
    try {
      const result = await onConfirm?.({
        confirmacao: "CONFIRMAR",
        senha: password,
      });

      if (result?.success) {
        return;
      }

      if (result?.message) {
        setError(result.message);
      }
    } catch (submitError) {
      const message =
        submitError?.message ||
        submitError?.response?.data?.message ||
        "Não foi possível concluir a exclusão. Tente novamente.";
      setError(message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-lg rounded-lg bg-white shadow-xl">
        <div className="border-b border-gray-200 px-6 py-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Excluir conta
          </h3>
          <p className="mt-1 text-sm text-gray-600">
            Esta ação é irreversível. Leia com atenção antes de continuar.
          </p>
        </div>

        <form onSubmit={handleConfirm} className="space-y-4 px-6 py-5">
          <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
            <p className="font-semibold">Ao excluir sua conta:</p>
            <ul className="mt-2 list-disc space-y-1 pl-4">
              <li>Todas as solicitações serão canceladas imediatamente.</li>
              <li>Seus dados serão removidos permanentemente.</li>
              <li>Você perderá acesso a todos os recursos da plataforma.</li>
              <li>Esta ação não pode ser desfeita.</li>
            </ul>
          </div>

          <div className="space-y-3">
            <Input
              label='Confirmação (digite "CONFIRMAR")'
              id="confirmacao"
              name="confirmacao"
              value={confirmText}
              onChange={(event) => setConfirmText(event.target.value)}
              required
              disabled={loading}
            />

            <Input
              label="Senha"
              id="senha_confirmacao"
              name="senha_confirmacao"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              disabled={loading}
            />

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
          </div>

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={
                loading || confirmText.trim().toUpperCase() !== "CONFIRMAR"
              }
            >
              {loading ? "Excluindo..." : "Excluir conta"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DeleteAccountModal;


