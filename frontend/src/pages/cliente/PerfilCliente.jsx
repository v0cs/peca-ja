import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ProfileTabs,
  ProfileForm,
  PasswordForm,
  DeleteAccountModal,
} from "../../components";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  LoadingSpinner,
} from "../../components/ui";
import { Header } from "../../components/layout";
import api from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import { formatarCelular } from "../../utils/validators";

const ufsValidas = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
];

const formatDate = (dateString) => {
  if (!dateString) return "—";
  try {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch (error) {
    return "—";
  }
};

const PerfilCliente = () => {
  const navigate = useNavigate();
  const { user, updateUser, logout } = useAuth();

  const [activeTab, setActiveTab] = useState("dados");
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState("");

  const [savingProfile, setSavingProfile] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoadingProfile(true);
      setProfileError("");
      try {
        const response = await api.get("/clientes/profile");
        if (response.data.success) {
          setProfile(response.data.data);
        } else {
          setProfileError(
            response.data.message || "Não foi possível carregar seus dados."
          );
        }
      } catch (error) {
        const message =
          error?.response?.data?.message ||
          "Erro ao carregar seus dados. Tente novamente.";
        setProfileError(message);
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchProfile();
  }, []);

  const initialValues = useMemo(() => {
    if (!profile) return {};

    const { cliente, usuario } = profile;
    return {
      nome_completo: cliente?.nome_completo || "",
      celular: formatarCelular(cliente?.celular || ""),
      cidade: cliente?.cidade || "",
      uf: (cliente?.uf || "").toUpperCase(),
      email: usuario?.email || "",
      dataCadastro: formatDate(cliente?.created_at || usuario?.created_at),
    };
  }, [profile]);

  const editableFields = useMemo(
    () => [
      {
        name: "nome_completo",
        label: "Nome completo",
        required: true,
        fullWidth: true,
        validate: (value) =>
          value && value.trim().length < 2
            ? "Nome completo deve ter pelo menos 2 caracteres"
            : "",
        normalize: (value) => (value || "").trim(),
      },
      {
        name: "celular",
        label: "Celular",
        required: true,
        placeholder: "(11)99999-9999",
        mask: (value) => formatarCelular(value || ""),
        validate: (value) => {
          const digits = (value || "").replace(/\D/g, "");
          if (digits.length !== 11) {
            return "Informe um celular válido com DDD";
          }
          return "";
        },
        normalize: (value) => {
          const digits = (value || "").replace(/\D/g, "").slice(0, 11);
          if (!digits) return "";
          return `(${digits.slice(0, 2)})${digits.slice(2)}`;
        },
      },
      {
        name: "cidade",
        label: "Cidade",
        required: true,
        validate: (value) =>
          value && value.trim().length < 2
            ? "Cidade deve ter pelo menos 2 caracteres"
            : "",
        normalize: (value) => (value || "").trim(),
      },
      {
        name: "uf",
        label: "UF",
        required: true,
        placeholder: "SP",
        maxLength: 2,
        mask: (value) => (value || "").toUpperCase().slice(0, 2),
        validate: (value) => {
          const uf = (value || "").toUpperCase();
          return ufsValidas.includes(uf) ? "" : "Informe uma UF válida";
        },
        normalize: (value) => (value || "").toUpperCase().slice(0, 2),
      },
    ],
    []
  );

  const readOnlyFields = useMemo(
    () => [
      {
        name: "email",
        label: "Email",
      },
      {
        name: "dataCadastro",
        label: "Data de cadastro",
      },
    ],
    []
  );

  const handleProfileSubmit = async (payload) => {
    setSavingProfile(true);
    try {
      const response = await api.put("/clientes/profile", payload);
      if (response.data.success) {
        setProfile(response.data.data);

        if (user) {
          updateUser({
            ...user,
            cliente: {
              ...(user.cliente || {}),
              ...response.data.data.cliente,
            },
          });
        }

        return {
          success: true,
          message: response.data.message || "Dados atualizados com sucesso.",
        };
      }

      return {
        success: false,
        message: response.data.message || "Não foi possível salvar os dados.",
        fieldErrors: response.data.errors,
      };
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        "Não foi possível salvar os dados. Tente novamente.";
      return {
        success: false,
        message,
        fieldErrors: error?.response?.data?.errors,
      };
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (values) => {
    setPasswordLoading(true);
    try {
      const response = await api.put("/usuarios/profile", {
        senha_atual: values.senha_atual,
        nova_senha: values.nova_senha,
      });

      if (response.data.success) {
        window.alert(
          "Senha alterada com sucesso. Você precisará fazer login novamente."
        );
        await logout();
        navigate("/login", { replace: true });

        return {
          success: true,
          message: response.data.message,
        };
      }

      return {
        success: false,
        message: response.data.message || "Não foi possível alterar a senha.",
        fieldErrors: response.data.errors,
      };
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        "Não foi possível alterar a senha. Tente novamente.";
      return {
        success: false,
        message,
        fieldErrors: error?.response?.data?.errors,
      };
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteAccount = async ({ confirmacao, senha }) => {
    setDeleteLoading(true);
    try {
      const response = await api.delete("/usuarios/profile", {
        data: {
          confirmacao,
          senha,
        },
      });

      if (response.data.success) {
        window.alert(
          "Sua conta foi excluída com sucesso. Sentiremos sua falta!"
        );
        await logout();
        navigate("/", { replace: true });
        setDeleteModalOpen(false);

        return {
          success: true,
          message: response.data.message,
        };
      }

      return {
        success: false,
        message: response.data.message || "Não foi possível excluir a conta.",
        fieldErrors: response.data.errors,
      };
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        "Não foi possível excluir a conta. Tente novamente.";
      return {
        success: false,
        message,
        fieldErrors: error?.response?.data?.errors,
      };
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleTabChange = (tabId) => {
    if (tabId === activeTab) return;
    if (hasUnsavedChanges) {
      const shouldProceed = window.confirm(
        "Você possui alterações não salvas. Deseja descartá-las e continuar?"
      );
      if (!shouldProceed) {
        return;
      }
    }
    setActiveTab(tabId);
  };

  const tabs = [
    { id: "dados", label: "Meus Dados" },
    { id: "seguranca", label: "Segurança" },
    { id: "conta", label: "Conta" },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header />
      <main className="container mx-auto flex-1 px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Configurações de Perfil</CardTitle>
            <CardDescription>
              Atualize seus dados pessoais, gerencie sua senha e controle sua
              conta de cliente.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingProfile && (
              <div className="py-12">
                <LoadingSpinner size="lg" />
              </div>
            )}

            {!loadingProfile && profileError && (
              <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {profileError}
              </div>
            )}

            {!loadingProfile && !profileError && profile && (
              <>
                <ProfileTabs
                  tabs={tabs}
                  activeTab={activeTab}
                  onTabChange={handleTabChange}
                />

                <div className="mt-6">
                  {activeTab === "dados" && (
                    <ProfileForm
                      fields={editableFields}
                      readOnlyFields={readOnlyFields}
                      initialValues={initialValues}
                      onSubmit={handleProfileSubmit}
                      loading={savingProfile}
                      onDirtyChange={setHasUnsavedChanges}
                      submitLabel="Salvar alterações"
                    />
                  )}

                  {activeTab === "seguranca" && (
                    <PasswordForm
                      onSubmit={handlePasswordSubmit}
                      loading={passwordLoading}
                    />
                  )}

                  {activeTab === "conta" && (
                    <div className="space-y-6">
                      <div className="rounded-md border border-red-200 bg-red-50 px-4 py-5">
                        <h3 className="text-lg font-semibold text-red-700">
                          Exclusão de conta
                        </h3>
                        <p className="mt-2 text-sm text-red-600">
                          Ao excluir a sua conta:
                        </p>
                        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-red-600">
                          <li>Todas as solicitações serão canceladas.</li>
                          <li>Seus dados serão removidos permanentemente.</li>
                          <li>Essa ação é irreversível.</li>
                        </ul>
                        <div className="mt-4">
                          <Button
                            variant="destructive"
                            onClick={() => setDeleteModalOpen(true)}
                          >
                            Excluir minha conta
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </main>

      <DeleteAccountModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteAccount}
        loading={deleteLoading}
      />
    </div>
  );
};

export default PerfilCliente;


