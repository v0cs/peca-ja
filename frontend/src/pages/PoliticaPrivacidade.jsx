import { useState } from "react";
import { Header, Footer } from "../components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui";
import { FileText, Shield } from "lucide-react";
import { cn } from "../lib/utils";

const PoliticaPrivacidade = () => {
  const [documentoSelecionado, setDocumentoSelecionado] =
    useState("privacidade"); // "privacidade" ou "termos"

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background to-card/50">
      <Header />

      <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Seletor de Documento */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setDocumentoSelecionado("privacidade")}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-3 p-4 rounded-lg border-2 transition-all",
                    documentoSelecionado === "privacidade"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <Shield
                    className={cn(
                      "h-5 w-5",
                      documentoSelecionado === "privacidade"
                        ? "text-primary"
                        : "text-muted-foreground"
                    )}
                  />
                  <span
                    className={cn(
                      "font-medium",
                      documentoSelecionado === "privacidade"
                        ? "text-primary"
                        : "text-muted-foreground"
                    )}
                  >
                    Política de Privacidade
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setDocumentoSelecionado("termos")}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-3 p-4 rounded-lg border-2 transition-all",
                    documentoSelecionado === "termos"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <FileText
                    className={cn(
                      "h-5 w-5",
                      documentoSelecionado === "termos"
                        ? "text-primary"
                        : "text-muted-foreground"
                    )}
                  />
                  <span
                    className={cn(
                      "font-medium",
                      documentoSelecionado === "termos"
                        ? "text-primary"
                        : "text-muted-foreground"
                    )}
                  >
                    Termos de Uso
                  </span>
                </button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-3xl font-bold text-center">
                {documentoSelecionado === "privacidade"
                  ? "Política de Privacidade"
                  : "Termos de Uso"}
              </CardTitle>
              <p className="text-center text-muted-foreground mt-2">
                Última atualização: {new Date().toLocaleDateString("pt-BR")}
              </p>
            </CardHeader>
            <CardContent className="prose prose-slate max-w-none">
              {documentoSelecionado === "privacidade" ? (
                <div className="space-y-6 text-foreground">
                  {/* POLÍTICA DE PRIVACIDADE */}
                  <section>
                    <h2 className="text-2xl font-semibold mb-4">
                      1. Introdução
                    </h2>
                    <p className="text-base leading-relaxed">
                      A <strong>PeçaJá</strong> está comprometida com a proteção
                      da privacidade e dos dados pessoais de seus usuários. Esta
                      Política de Privacidade descreve como coletamos, usamos,
                      armazenamos e protegemos suas informações pessoais, em
                      conformidade com a{" "}
                      <strong>
                        Lei Geral de Proteção de Dados (LGPD - Lei nº
                        13.709/2018)
                      </strong>{" "}
                      e demais legislações aplicáveis.
                    </p>
                    <p className="text-base leading-relaxed mt-3">
                      Ao utilizar nossos serviços, você concorda com as práticas
                      descritas nesta política. Recomendamos a leitura atenta
                      deste documento.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-2xl font-semibold mb-4">
                      2. Dados Coletados
                    </h2>
                    <p className="text-base leading-relaxed mb-3">
                      Coletamos os seguintes tipos de dados pessoais:
                    </p>

                    <h3 className="text-xl font-semibold mt-4 mb-2">
                      2.1. Dados de Cadastro
                    </h3>
                    <ul className="list-disc pl-6 space-y-2 text-base">
                      <li>
                        Clientes: Nome completo, e-mail, celular, cidade, estado
                        (UF)
                      </li>
                      <li>
                        Autopeças: Razão social, nome fantasia, CNPJ, e-mail,
                        telefone, endereço completo (CEP, rua, número, bairro,
                        cidade, UF)
                      </li>
                      <li>
                        Vendedores: Nome completo, e-mail, telefone (vinculados
                        à autopeça)
                      </li>
                    </ul>

                    <h3 className="text-xl font-semibold mt-4 mb-2">
                      2.2. Dados de Autenticação
                    </h3>
                    <ul className="list-disc pl-6 space-y-2 text-base">
                      <li>Senha (armazenada de forma criptografada)</li>
                      <li>Token de autenticação (para sessões)</li>
                      <li>
                        Dados de autenticação via Google OAuth (quando
                        aplicável)
                      </li>
                    </ul>

                    <h3 className="text-xl font-semibold mt-4 mb-2">
                      2.3. Dados de Solicitações
                    </h3>
                    <ul className="list-disc pl-6 space-y-2 text-base">
                      <li>
                        Informações do veículo (marca, modelo, ano, placa,
                        categoria)
                      </li>
                      <li>Descrição da peça solicitada</li>
                      <li>Imagens anexadas</li>
                      <li>Status e histórico de solicitações</li>
                    </ul>

                    <h3 className="text-xl font-semibold mt-4 mb-2">
                      2.4. Dados de Navegação
                    </h3>
                    <ul className="list-disc pl-6 space-y-2 text-base">
                      <li>Endereço IP</li>
                      <li>Informações do navegador e dispositivo</li>
                      <li>Logs de acesso e ações realizadas na plataforma</li>
                      <li>Cookies e tecnologias similares</li>
                    </ul>
                  </section>

                  <section>
                    <h2 className="text-2xl font-semibold mb-4">
                      3. Finalidade do Tratamento dos Dados
                    </h2>
                    <p className="text-base leading-relaxed mb-3">
                      Utilizamos seus dados pessoais para as seguintes
                      finalidades:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 text-base">
                      <li>
                        Prestação de serviços: Permitir o cadastro, autenticação
                        e uso da plataforma
                      </li>
                      <li>
                        Conectividade: Conectar clientes e autopeças para
                        solicitações de orçamento
                      </li>
                      <li>
                        Comunicação: Enviar notificações sobre solicitações,
                        atendimentos e atualizações do sistema
                      </li>
                      <li>
                        Melhoria dos serviços: Analisar o uso da plataforma para
                        melhorar funcionalidades e experiência do usuário
                      </li>
                      <li>
                        Segurança: Prevenir fraudes, garantir a segurança da
                        plataforma e cumprir obrigações legais
                      </li>
                      <li>
                        Suporte: Prestar atendimento ao cliente e resolver
                        problemas técnicos
                      </li>
                      <li>
                        Compliance: Cumprir obrigações legais e regulatórias
                        aplicáveis
                      </li>
                    </ul>
                  </section>

                  <section>
                    <h2 className="text-2xl font-semibold mb-4">
                      4. Base Legal para o Tratamento
                    </h2>
                    <p className="text-base leading-relaxed mb-3">
                      O tratamento de seus dados pessoais é realizado com base
                      nas seguintes hipóteses legais previstas na LGPD:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 text-base">
                      <li>
                        Execução de contrato: Para cumprimento das obrigações
                        decorrentes do uso da plataforma
                      </li>
                      <li>
                        Consentimento: Quando você aceita esta política e os
                        termos de uso
                      </li>
                      <li>
                        Legítimo interesse: Para melhorar nossos serviços e
                        garantir a segurança da plataforma
                      </li>
                      <li>
                        Cumprimento de obrigação legal: Para atender exigências
                        legais e regulatórias
                      </li>
                    </ul>
                  </section>

                  <section>
                    <h2 className="text-2xl font-semibold mb-4">
                      5. Compartilhamento de Dados
                    </h2>
                    <p className="text-base leading-relaxed mb-3">
                      Seus dados pessoais podem ser compartilhados nas seguintes
                      situações:
                    </p>

                    <h3 className="text-xl font-semibold mt-4 mb-2">
                      5.1. Entre Usuários da Plataforma
                    </h3>
                    <ul className="list-disc pl-6 space-y-2 text-base">
                      <li>
                        Dados de contato (nome, telefone) são compartilhados
                        entre clientes e autopeças quando uma solicitação é
                        criada ou atendida
                      </li>
                      <li>
                        Informações de solicitações são visíveis para autopeças
                        da mesma cidade do cliente
                      </li>
                    </ul>

                    <h3 className="text-xl font-semibold mt-4 mb-2">
                      5.2. Prestadores de Serviços
                    </h3>
                    <ul className="list-disc pl-6 space-y-2 text-base">
                      <li>Hospedagem: Amazon Web Services</li>
                      <li>Serviços de e-mail: Resend API</li>
                      <li>Armazenamento: Amazon S3 para imagens</li>
                      <li>Autenticação: Google OAuth 2.0</li>
                    </ul>

                    <h3 className="text-xl font-semibold mt-4 mb-2">
                      5.3. Obrigações Legais
                    </h3>
                    <p className="text-base leading-relaxed">
                      Podemos compartilhar dados quando exigido por lei, ordem
                      judicial ou autoridade competente, ou para proteger nossos
                      direitos e segurança.
                    </p>

                    <p className="text-base leading-relaxed mt-3">
                      <strong>
                        Não vendemos, alugamos ou comercializamos seus dados
                        pessoais para terceiros.
                      </strong>
                    </p>
                  </section>

                  <section>
                    <h2 className="text-2xl font-semibold mb-4">
                      6. Armazenamento e Segurança dos Dados
                    </h2>
                    <p className="text-base leading-relaxed mb-3">
                      Implementamos medidas técnicas e organizacionais adequadas
                      para proteger seus dados pessoais:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 text-base">
                      <li>
                        Criptografia de senhas usando algoritmos seguros
                        (bcrypt)
                      </li>
                      <li>Uso de conexões seguras (HTTPS/SSL)</li>
                      <li>
                        Controle de acesso baseado em autenticação e autorização
                      </li>
                      <li>Monitoramento e logs de segurança</li>
                      <li>Backups regulares dos dados</li>
                      <li>Atualizações de segurança do sistema</li>
                    </ul>
                    <p className="text-base leading-relaxed mt-3">
                      Seus dados são armazenados em servidores localizados no
                      Brasil ou em países que oferecem nível adequado de
                      proteção de dados.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-2xl font-semibold mb-4">
                      7. Retenção de Dados
                    </h2>
                    <p className="text-base leading-relaxed mb-3">
                      Mantemos seus dados pessoais pelo tempo necessário para:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 text-base">
                      <li>
                        Cumprir as finalidades para as quais foram coletados
                      </li>
                      <li>
                        Atender obrigações legais, contábeis e regulatórias
                      </li>
                      <li>Resolver disputas e fazer cumprir nossos acordos</li>
                    </ul>
                    <p className="text-base leading-relaxed mt-3">
                      Após o término do período de retenção, os dados serão
                      excluídos de forma segura, exceto quando a retenção for
                      exigida por lei.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-2xl font-semibold mb-4">
                      8. Seus Direitos (LGPD)
                    </h2>
                    <p className="text-base leading-relaxed mb-3">
                      Conforme a LGPD, você possui os seguintes direitos em
                      relação aos seus dados pessoais:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 text-base">
                      <li>
                        Confirmação e acesso: Saber se tratamos seus dados e
                        acessá-los
                      </li>
                      <li>
                        Correção: Solicitar a correção de dados incompletos,
                        inexatos ou desatualizados
                      </li>
                      <li>
                        Anonimização, bloqueio ou eliminação: Solicitar a
                        remoção de dados desnecessários ou tratados em
                        desconformidade com a LGPD
                      </li>
                      <li>
                        Portabilidade: Solicitar a portabilidade de seus dados
                        para outro fornecedor
                      </li>
                      <li>
                        Eliminação: Solicitar a exclusão de dados tratados com
                        base em consentimento
                      </li>
                      <li>
                        Informação: Obter informações sobre entidades públicas e
                        privadas com as quais compartilhamos dados
                      </li>
                      <li>
                        Revogação do consentimento: Revogar seu consentimento a
                        qualquer momento
                      </li>
                      <li>
                        Oposição: Opor-se ao tratamento de dados em certas
                        circunstâncias
                      </li>
                      <li>
                        Revisão de decisões: Solicitar revisão de decisões
                        tomadas unicamente com base em tratamento automatizado
                      </li>
                    </ul>
                    <p className="text-base leading-relaxed mt-3">
                      Para exercer seus direitos, entre em contato conosco
                      através dos canais indicados na seção "Contato" desta
                      política.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-2xl font-semibold mb-4">
                      9. Cookies e Tecnologias Similares
                    </h2>
                    <p className="text-base leading-relaxed mb-3">
                      Utilizamos cookies e tecnologias similares para:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 text-base">
                      <li>Manter sua sessão ativa</li>
                      <li>Lembrar suas preferências</li>
                      <li>Melhorar a segurança da plataforma</li>
                      <li>Analisar o uso da plataforma</li>
                    </ul>
                    <p className="text-base leading-relaxed mt-3">
                      Você pode gerenciar ou desabilitar cookies através das
                      configurações do seu navegador. Note que a desabilitação
                      de cookies pode afetar o funcionamento de algumas
                      funcionalidades da plataforma.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-2xl font-semibold mb-4">
                      10. Alterações nesta Política
                    </h2>
                    <p className="text-base leading-relaxed">
                      Podemos atualizar esta Política de Privacidade
                      periodicamente. Notificaremos você sobre alterações
                      significativas através de e-mail ou aviso na plataforma. A
                      data da última atualização está indicada no topo desta
                      página. Recomendamos que você revise esta política
                      regularmente.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-2xl font-semibold mb-4">
                      11. Contato e Encarregado de Dados (DPO)
                    </h2>
                    <p className="text-base leading-relaxed mb-3">
                      Para exercer seus direitos, fazer perguntas sobre esta
                      política ou reportar problemas relacionados ao tratamento
                      de dados pessoais, entre em contato conosco. Responderemos
                      sua solicitação no prazo máximo de 15 (quinze) dias,
                      conforme previsto na LGPD.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-2xl font-semibold mb-4">
                      12. Lei Aplicável e Foro
                    </h2>
                    <p className="text-base leading-relaxed">
                      Esta Política de Privacidade é regida pela legislação
                      brasileira, especialmente a Lei Geral de Proteção de Dados
                      (Lei nº 13.709/2018). Qualquer disputa relacionada ao
                      tratamento de dados pessoais será resolvida nos termos da
                      legislação brasileira e pelos órgãos competentes.
                    </p>
                  </section>

                  <section className="bg-primary/5 p-6 rounded-lg border border-primary/20">
                    <h2 className="text-2xl font-semibold mb-4">
                      13. Consentimento
                    </h2>
                    <p className="text-base leading-relaxed">
                      Ao utilizar a plataforma PeçaJá e aceitar esta Política de
                      Privacidade, você declara ter lido, compreendido e
                      concordado com o tratamento de seus dados pessoais
                      conforme descrito neste documento.
                    </p>
                  </section>
                </div>
              ) : (
                <div className="space-y-6 text-foreground">
                  {/* TERMOS DE USO */}
                  <section>
                    <h2 className="text-2xl font-semibold mb-4">
                      1. Aceitação dos Termos
                    </h2>
                    <p className="text-base leading-relaxed">
                      Bem-vindo à plataforma <strong>PeçaJá</strong>. Estes
                      Termos de Uso ("Termos") regem o uso da plataforma PeçaJá,
                      incluindo todos os serviços, funcionalidades e recursos
                      disponíveis através do nosso site e aplicações.
                    </p>
                    <p className="text-base leading-relaxed mt-3">
                      Ao acessar ou utilizar a plataforma PeçaJá, você concorda
                      em cumprir e estar vinculado a estes Termos de Uso. Se
                      você não concordar com qualquer parte destes termos, não
                      deve utilizar nossos serviços.
                    </p>
                    <p className="text-base leading-relaxed mt-3">
                      Estes Termos constituem um acordo legal entre você e a
                      PeçaJá. Recomendamos a leitura atenta deste documento
                      antes de utilizar a plataforma.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-2xl font-semibold mb-4">
                      2. Definições
                    </h2>
                    <ul className="list-disc pl-6 space-y-2 text-base">
                      <li>
                        Plataforma: Refere-se ao site, aplicações e todos os
                        serviços oferecidos pela PeçaJá
                      </li>
                      <li>
                        Usuário: Qualquer pessoa que acessa ou utiliza a
                        plataforma
                      </li>
                      <li>
                        Cliente: Usuário cadastrado como proprietário de veículo
                        ou oficina que cria solicitações de peças
                      </li>
                      <li>
                        Autopeça: Usuário cadastrado como estabelecimento
                        comercial que visualiza e atende solicitações
                      </li>
                      <li>
                        Vendedor: Funcionário cadastrado por uma autopeça para
                        operar na plataforma
                      </li>
                      <li>
                        Solicitação: Pedido de orçamento criado por um cliente
                        na plataforma
                      </li>
                      <li>Conta: Perfil de usuário criado na plataforma</li>
                    </ul>
                  </section>

                  <section>
                    <h2 className="text-2xl font-semibold mb-4">
                      3. Cadastro e Conta de Usuário
                    </h2>

                    <h3 className="text-xl font-semibold mt-4 mb-2">
                      3.1. Elegibilidade
                    </h3>
                    <p className="text-base leading-relaxed mb-3">
                      Para utilizar a plataforma, você deve:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 text-base">
                      <li>Ter pelo menos 18 (dezoito) anos de idade</li>
                      <li>Ter capacidade legal para celebrar contratos</li>
                      <li>
                        Fornecer informações verdadeiras, precisas, atuais e
                        completas durante o cadastro
                      </li>
                      <li>
                        Manter e atualizar suas informações para mantê-las
                        verdadeiras, precisas, atuais e completas
                      </li>
                    </ul>

                    <h3 className="text-xl font-semibold mt-4 mb-2">
                      3.2. Criação de Conta
                    </h3>
                    <p className="text-base leading-relaxed mb-3">
                      Para criar uma conta, você deve:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 text-base">
                      <li>Fornecer um endereço de e-mail válido</li>
                      <li>Criar uma senha segura</li>
                      <li>
                        Completar todas as informações obrigatórias do cadastro
                      </li>
                      <li>
                        Aceitar estes Termos de Uso e a Política de Privacidade
                      </li>
                    </ul>

                    <h3 className="text-xl font-semibold mt-4 mb-2">
                      3.3. Responsabilidade pela Conta
                    </h3>
                    <p className="text-base leading-relaxed">
                      Você é responsável por manter a confidencialidade de suas
                      credenciais de acesso (e-mail e senha) e por todas as
                      atividades que ocorram em sua conta. Você deve notificar
                      imediatamente a PeçaJá sobre qualquer uso não autorizado
                      de sua conta ou qualquer outra violação de segurança.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-2xl font-semibold mb-4">
                      4. Uso da Plataforma
                    </h2>

                    <h3 className="text-xl font-semibold mt-4 mb-2">
                      4.1. Uso Permitido
                    </h3>
                    <p className="text-base leading-relaxed mb-3">
                      Você concorda em utilizar a plataforma apenas para fins
                      legítimos e de acordo com estes Termos. Você pode:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 text-base">
                      <li>
                        Criar e gerenciar solicitações de peças (clientes)
                      </li>
                      <li>
                        Visualizar e responder a solicitações (autopeças e
                        vendedores)
                      </li>
                      <li>Gerenciar seu perfil e informações</li>
                      <li>
                        Utilizar os recursos e funcionalidades disponíveis na
                        plataforma
                      </li>
                    </ul>

                    <h3 className="text-xl font-semibold mt-4 mb-2">
                      4.2. Uso Proibido
                    </h3>
                    <p className="text-base leading-relaxed mb-3">
                      Você concorda em NÃO utilizar a plataforma para:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 text-base">
                      <li>Qualquer finalidade ilegal ou não autorizada</li>
                      <li>
                        Violar qualquer lei, regulamento ou direito de terceiros
                      </li>
                      <li>
                        Enviar, publicar ou transmitir conteúdo ofensivo,
                        difamatório, fraudulento ou enganoso
                      </li>
                      <li>
                        Interferir ou interromper o funcionamento da plataforma
                        ou servidores
                      </li>
                      <li>
                        Tentar obter acesso não autorizado a qualquer parte da
                        plataforma
                      </li>
                      <li>
                        Usar robôs, scripts ou outros meios automatizados para
                        acessar a plataforma
                      </li>
                      <li>
                        Coletar informações de outros usuários sem autorização
                      </li>
                      <li>Criar contas falsas ou usar identidades falsas</li>
                      <li>Spam, phishing ou outras atividades fraudulentas</li>
                      <li>
                        Vender, alugar ou transferir sua conta para terceiros
                      </li>
                    </ul>
                  </section>

                  <section>
                    <h2 className="text-2xl font-semibold mb-4">
                      5. Solicitações e Atendimentos
                    </h2>

                    <h3 className="text-xl font-semibold mt-4 mb-2">
                      5.1. Criação de Solicitações
                    </h3>
                    <p className="text-base leading-relaxed mb-3">
                      Ao criar uma solicitação, você concorda em:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 text-base">
                      <li>
                        Fornecer informações verdadeiras e precisas sobre o
                        veículo e a peça solicitada
                      </li>
                      <li>Anexar apenas imagens relacionadas à solicitação</li>
                      <li>
                        Manter a solicitação atualizada e cancelá-la quando não
                        for mais necessária
                      </li>
                      <li>
                        Responder adequadamente aos contatos das autopeças
                        interessadas
                      </li>
                    </ul>

                    <h3 className="text-xl font-semibold mt-4 mb-2">
                      5.2. Atendimento de Solicitações
                    </h3>
                    <p className="text-base leading-relaxed mb-3">
                      Ao atender uma solicitação, você concorda em:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 text-base">
                      <li>
                        Fornecer informações verdadeiras sobre produtos e
                        serviços
                      </li>
                      <li>
                        Respeitar os dados de contato fornecidos pelo cliente
                      </li>
                      <li>
                        Não utilizar informações de contato para fins não
                        relacionados à solicitação
                      </li>
                      <li>
                        Marcar corretamente o status de atendimento na
                        plataforma
                      </li>
                    </ul>

                    <h3 className="text-xl font-semibold mt-4 mb-2">
                      5.3. Negociação Externa
                    </h3>
                    <p className="text-base leading-relaxed">
                      A plataforma PeçaJá funciona como um intermediário para
                      conectar clientes e autopeças. Todas as negociações,
                      acordos comerciais e transações financeiras ocorrem
                      diretamente entre as partes, fora da plataforma. A PeçaJá
                      não se responsabiliza por tais negociações ou transações.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-2xl font-semibold mb-4">
                      6. Propriedade Intelectual
                    </h2>
                    <p className="text-base leading-relaxed mb-3">
                      A plataforma PeçaJá, incluindo seu design,
                      funcionalidades, código, logotipos, marcas e conteúdo, é
                      propriedade da PeçaJá e está protegida por leis de
                      propriedade intelectual.
                    </p>
                    <p className="text-base leading-relaxed mt-3">
                      Você não pode copiar, modificar, distribuir, vender ou
                      alugar qualquer parte da plataforma sem autorização prévia
                      por escrito da PeçaJá.
                    </p>
                    <p className="text-base leading-relaxed mt-3">
                      Você mantém a propriedade sobre o conteúdo que você cria e
                      envia através da plataforma (solicitações, imagens, etc.),
                      mas concede à PeçaJá uma licença não exclusiva para usar,
                      exibir e distribuir esse conteúdo na plataforma.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-2xl font-semibold mb-4">
                      7. Privacidade e Proteção de Dados
                    </h2>
                    <p className="text-base leading-relaxed">
                      O tratamento de seus dados pessoais é regido pela nossa{" "}
                      <strong>Política de Privacidade</strong>, que faz parte
                      integrante destes Termos de Uso. Ao utilizar a plataforma,
                      você concorda com o tratamento de seus dados conforme
                      descrito na Política de Privacidade.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-2xl font-semibold mb-4">
                      8. Disponibilidade e Modificações do Serviço
                    </h2>
                    <p className="text-base leading-relaxed mb-3">
                      A PeçaJá se esforça para manter a plataforma disponível e
                      funcionando corretamente, mas não garante:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 text-base">
                      <li>Disponibilidade ininterrupta ou livre de erros</li>
                      <li>Correção imediata de todos os problemas técnicos</li>
                      <li>
                        Compatibilidade com todos os dispositivos ou navegadores
                      </li>
                    </ul>
                    <p className="text-base leading-relaxed mt-3">
                      Reservamo-nos o direito de modificar, suspender ou
                      descontinuar qualquer parte da plataforma a qualquer
                      momento, com ou sem aviso prévio.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-2xl font-semibold mb-4">
                      9. Limitação de Responsabilidade
                    </h2>
                    <p className="text-base leading-relaxed mb-3">
                      A PeçaJá atua como uma plataforma intermediária que
                      conecta clientes e autopeças. Nesse sentido:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 text-base">
                      <li>
                        A PeçaJá não é parte nas negociações ou transações entre
                        usuários
                      </li>
                      <li>
                        A PeçaJá não garante a qualidade, segurança ou
                        legalidade dos produtos ou serviços oferecidos pelas
                        autopeças
                      </li>
                      <li>
                        A PeçaJá não se responsabiliza por danos diretos,
                        indiretos, incidentais ou consequenciais decorrentes do
                        uso da plataforma
                      </li>
                      <li>
                        A PeçaJá não se responsabiliza por informações
                        incorretas fornecidas pelos usuários
                      </li>
                      <li>
                        A PeçaJá não garante que as solicitações resultarão em
                        transações bem-sucedidas
                      </li>
                    </ul>
                    <p className="text-base leading-relaxed mt-3">
                      Você utiliza a plataforma por sua conta e risco. É sua
                      responsabilidade verificar a veracidade das informações e
                      a qualidade dos produtos e serviços oferecidos.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-2xl font-semibold mb-4">
                      10. Indenização
                    </h2>
                    <p className="text-base leading-relaxed">
                      Você concorda em indenizar e isentar a PeçaJá, seus
                      diretores, funcionários e parceiros de qualquer
                      reclamação, dano, perda, responsabilidade e despesa
                      (incluindo honorários advocatícios) decorrentes de: (i)
                      seu uso da plataforma; (ii) sua violação destes Termos;
                      (iii) sua violação de qualquer direito de terceiros; ou
                      (iv) qualquer conteúdo que você envie ou transmita através
                      da plataforma.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-2xl font-semibold mb-4">
                      11. Encerramento de Conta
                    </h2>

                    <h3 className="text-xl font-semibold mt-4 mb-2">
                      11.1. Encerramento pelo Usuário
                    </h3>
                    <p className="text-base leading-relaxed">
                      Você pode encerrar sua conta a qualquer momento através
                      das configurações da plataforma ou entrando em contato
                      conosco. Ao encerrar sua conta, você perderá o acesso a
                      todos os dados e funcionalidades associadas à conta.
                    </p>

                    <h3 className="text-xl font-semibold mt-4 mb-2">
                      11.2. Encerramento pela PeçaJá
                    </h3>
                    <p className="text-base leading-relaxed mb-3">
                      A PeçaJá pode encerrar ou suspender sua conta
                      imediatamente, sem aviso prévio, se você:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 text-base">
                      <li>Violar estes Termos de Uso</li>
                      <li>
                        Utilizar a plataforma de forma fraudulenta ou ilegal
                      </li>
                      <li>Fornecer informações falsas ou enganosas</li>
                      <li>Interferir no funcionamento da plataforma</li>
                      <li>Não utilizar a conta por um período prolongado</li>
                    </ul>
                  </section>

                  <section>
                    <h2 className="text-2xl font-semibold mb-4">
                      12. Modificações dos Termos
                    </h2>
                    <p className="text-base leading-relaxed">
                      A PeçaJá reserva-se o direito de modificar estes Termos de
                      Uso a qualquer momento. Notificaremos você sobre
                      alterações significativas através de e-mail ou aviso na
                      plataforma. O uso continuado da plataforma após as
                      modificações constitui sua aceitação dos novos termos. Se
                      você não concordar com as modificações, deve encerrar sua
                      conta e deixar de utilizar a plataforma.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-2xl font-semibold mb-4">
                      13. Lei Aplicável e Foro
                    </h2>
                    <p className="text-base leading-relaxed">
                      Estes Termos de Uso são regidos pela legislação
                      brasileira. Qualquer disputa relacionada a estes Termos
                      será resolvida nos tribunais competentes do Brasil, sendo
                      eleito o foro da comarca onde a PeçaJá tem sua sede,
                      renunciando as partes a qualquer outro, por mais
                      privilegiado que seja.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-2xl font-semibold mb-4">
                      14. Disposições Gerais
                    </h2>

                    <h3 className="text-xl font-semibold mt-4 mb-2">
                      14.1. Acordo Completo
                    </h3>
                    <p className="text-base leading-relaxed">
                      Estes Termos de Uso, juntamente com a Política de
                      Privacidade, constituem o acordo completo entre você e a
                      PeçaJá em relação ao uso da plataforma.
                    </p>

                    <h3 className="text-xl font-semibold mt-4 mb-2">
                      14.2. Divisibilidade
                    </h3>
                    <p className="text-base leading-relaxed">
                      Se qualquer disposição destes Termos for considerada
                      inválida ou inexequível, as demais disposições
                      permanecerão em pleno vigor e efeito.
                    </p>

                    <h3 className="text-xl font-semibold mt-4 mb-2">
                      14.3. Renúncia
                    </h3>
                    <p className="text-base leading-relaxed">
                      A falha da PeçaJá em exercer ou fazer valer qualquer
                      direito ou disposição destes Termos não constituirá uma
                      renúncia a tal direito ou disposição.
                    </p>

                    <h3 className="text-xl font-semibold mt-4 mb-2">
                      14.4. Contato
                    </h3>
                    <p className="text-base leading-relaxed mb-3">
                      Se você tiver dúvidas sobre estes Termos de Uso, entre em
                      contato conosco através dos canais disponíveis na
                      plataforma.
                    </p>
                  </section>

                  <section className="bg-primary/5 p-6 rounded-lg border border-primary/20">
                    <h2 className="text-2xl font-semibold mb-4">
                      15. Aceitação
                    </h2>
                    <p className="text-base leading-relaxed">
                      Ao criar uma conta na plataforma PeçaJá e aceitar estes
                      Termos de Uso, você declara ter lido, compreendido e
                      concordado com todas as disposições aqui estabelecidas.
                    </p>
                  </section>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PoliticaPrivacidade;
