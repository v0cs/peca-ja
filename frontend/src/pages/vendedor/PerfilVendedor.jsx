import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "../../components/layout";
import {
  ProfileTabs,
  ProfileForm,
  PasswordForm,
} from "../../components";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  LoadingSpinner,
} from "../../components/ui";
import api from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";

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

const PerfilVendedor = () => {
  const navigate = useNavigate();
  const { user, updateUser, logout } = useAuth();

  const [activeTab, setActiveTab] = useState("dados");
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState("");

  const [savingProfile, setSavingProfile] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoadingProfile(true);
      setProfileError("");
      try {
        const response = await api.get("/vendedor/profile");
        if (response.data.success) {
          setProfile(response.data.data);
        } else {
          setProfileError(
            response.data.message ||
              "Não foi possível carregar os dados do vendedor."
          );
        }
      } catch (error) {
        const message =
          error?.response?.data?.message ||
          "Erro ao carregar os dados do vendedor. Tente novamente.";
        setProfileError(message);
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchProfile();
  }, []);

  const initialValues = useMemo(() => {
    if (!profile) return {};

    const { vendedor, usuario, autopeca } = profile;
    return {
      nome_completo: vendedor?.nome_completo || "",
      email: usuario?.email || "",
      autopeca:
        autopeca?.nome_fantasia ||
        autopeca?.razao_social ||
        "Autopeça não identificada",
      dataCadastro: formatDate(vendedor?.created_at || usuario?.created_at),
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
        name: "autopeca",
        label: "Autopeça",
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
      const response = await api.put("/vendedor/profile", payload);
      if (response.data.success) {
        setProfile(response.data.data);

        if (user) {
          updateUser({
            ...user,
            vendedor: {
              ...(user.vendedor || {}),
              ...response.data.data.vendedor,
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
  ];

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header />
      <main className="container mx-auto flex-1 px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Perfil do Vendedor</CardTitle>
            <CardDescription>
              Atualize seu nome e gerencie a sua senha de acesso. A exclusão da
              conta é gerenciada pela autopeça.
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
                    <>
                      {user?.google_id ? (
                        <div className="space-y-4">
                          <div className="rounded-md border border-blue-200 bg-blue-50 px-4 py-5">
                            <h3 className="text-lg font-semibold text-blue-700">
                              Conta vinculada ao Google
                            </h3>
                            <p className="mt-2 text-sm text-blue-600">
                              Sua conta foi criada via Google OAuth e está vinculada à sua conta do Google.
                            </p>
                            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-blue-600">
                              <li>Você faz login usando sua conta do Google</li>
                              <li>Não é necessário criar ou alterar senha</li>
                              <li>Sua autenticação é gerenciada pelo Google</li>
                            </ul>
                            <p className="mt-4 text-sm text-blue-600">
                              <strong>Importante:</strong> Para alterar sua senha do Google, acesse suas{" "}
                              <a
                                href="https://myaccount.google.com/security"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-medium underline hover:text-blue-700"
                              >
                                configurações de segurança do Google
                              </a>
                              .
                            </p>
                          </div>
                        </div>
                      ) : (
                        <PasswordForm
                          onSubmit={handlePasswordSubmit}
                          loading={passwordLoading}
                        />
                      )}
                    </>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default PerfilVendedor;




