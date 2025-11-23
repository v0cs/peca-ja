import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";
import { LoadingSpinner } from "../components/ui";

const OAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { updateUser } = useAuth();
  const [status, setStatus] = useState("processando");

  useEffect(() => {
    const handleOAuthCallback = async () => {
      const tokenFromURL = searchParams.get("token");
      const success = searchParams.get("success");
      const error = searchParams.get("error");

      // Se houve erro no callback
      if (success === "false" || error) {
        setStatus("erro");
        setTimeout(() => {
          navigate("/login", {
            state: { error: error || "Erro ao fazer login com Google" },
          });
        }, 3000);
        return;
      }

      // Se não tem token na URL
      if (!tokenFromURL) {
        setStatus("erro");
        setTimeout(() => {
          navigate("/login", {
            state: { error: "Token não recebido. Tente novamente." },
          });
        }, 3000);
        return;
      }

      try {
        // Salvar token no localStorage
        localStorage.setItem("token", tokenFromURL);

        // Buscar dados do usuário usando o token
        const response = await api.get("/auth/me");

        if (response.data.success) {
          const userData = response.data.data;

          // Salvar dados do usuário
          const perfil =
            userData.cliente || userData.autopeca || userData.vendedor || null;
          const fullUserData = {
            ...userData.usuario,
            cliente: userData.cliente || null,
            autopeca: userData.autopeca || null,
            vendedor: userData.vendedor || null,
            perfil: perfil,
          };

          // Atualizar estado ANTES de salvar no localStorage para garantir sincronização
          updateUser(fullUserData, tokenFromURL);
          localStorage.setItem("user", JSON.stringify(fullUserData));

          setStatus("sucesso");

          // Redirecionar imediatamente para dashboard baseado no tipo de usuário
          // Usar setTimeout mínimo apenas para garantir que o React processou a atualização do estado
          const tipoUsuario = userData.usuario.tipo_usuario;
          
          // Usar requestAnimationFrame para garantir que o DOM foi atualizado
          requestAnimationFrame(() => {
            setTimeout(() => {
              if (tipoUsuario === "cliente") {
                navigate("/dashboard/cliente", { replace: true });
              } else if (tipoUsuario === "autopeca") {
                navigate("/dashboard/autopeca", { replace: true });
              } else if (tipoUsuario === "vendedor") {
                navigate("/vendedor/dashboard", { replace: true });
              } else {
                navigate("/", { replace: true });
              }
            }, 50); // Delay mínimo para garantir que o Header re-renderizou
          });
        } else {
          throw new Error("Erro ao buscar dados do usuário");
        }
      } catch (error) {
        console.error("Erro no callback OAuth:", error);
        setStatus("erro");
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        setTimeout(() => {
          navigate("/login", {
            state: {
              error:
                error.response?.data?.message ||
                "Erro ao processar login com Google. Tente novamente.",
            },
          });
        }, 3000);
      }
    };

    handleOAuthCallback();
  }, [searchParams, navigate, updateUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        {status === "processando" && (
          <>
            <LoadingSpinner size="lg" />
            <h2 className="mt-4 text-xl font-semibold text-gray-800">
              Processando login com Google...
            </h2>
            <p className="mt-2 text-gray-600">Aguarde um momento</p>
          </>
        )}

        {status === "sucesso" && (
          <>
            <div className="mb-4">
              <svg
                className="mx-auto h-16 w-16 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-800">
              Login realizado com sucesso!
            </h2>
            <p className="mt-2 text-gray-600">Redirecionando...</p>
          </>
        )}

        {status === "erro" && (
          <>
            <div className="mb-4">
              <svg
                className="mx-auto h-16 w-16 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-800">
              Erro ao fazer login
            </h2>
            <p className="mt-2 text-gray-600">Redirecionando para login...</p>
          </>
        )}
      </div>
    </div>
  );
};

export default OAuthCallback;

