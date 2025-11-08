import { Link } from "react-router-dom";
import { Header, Footer } from "../components/layout";
import { Button } from "../components/ui";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui";
import { Car, Store, MessageCircle, MapPin, Clock, Users } from "lucide-react";

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-card/50">
      <Header />

      {/* Hero Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-6xl font-bold text-balance mb-6">
            Encontre as <span className="text-primary">melhores autopeças</span>{" "}
            da sua cidade
          </h2>
          <p className="text-xl text-muted-foreground text-balance mb-8 max-w-2xl mx-auto">
            Conectamos você com autopeças locais através de solicitações de
            orçamentos. Rápido, fácil e direto no WhatsApp.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/cadastrar?type=cliente">
              <Button size="lg" className="w-full sm:w-auto">
                <Car className="mr-2 h-5 w-5" />
                Sou Cliente
              </Button>
            </Link>
            <Link to="/cadastrar?type=autopeca">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                <Store className="mr-2 h-5 w-5" />
                Sou Autopeça
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-card/50">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-bold text-center mb-12">
            Como funciona
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Car className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>1. Solicite sua peça</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Informe os dados do seu veículo e descreva a peça que precisa.
                  Anexe fotos se necessário.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <MapPin className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>2. Autopeças locais veem</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Autopeças da sua cidade recebem sua solicitação e podem entrar
                  em contato diretamente.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <MessageCircle className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>3. Negocie no WhatsApp</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Receba contatos via WhatsApp, compare preços e escolha a
                  melhor opção para você.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-3xl font-bold mb-6">Vantagens para todos</h3>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Clock className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Economia de tempo</h4>
                    <p className="text-muted-foreground">
                      Não precisa ligar para várias autopeças. Elas vêm até
                      você.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Conexão local</h4>
                    <p className="text-muted-foreground">
                      Apenas autopeças da sua cidade podem ver suas
                      solicitações.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Gestão de equipe</h4>
                    <p className="text-muted-foreground">
                      Autopeças podem cadastrar vendedores com sistema
                      anti-conflito.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl p-8">
              <div className="text-center">
                <Car className="h-24 w-24 text-primary mx-auto mb-6" />
                <h4 className="text-2xl font-bold mb-4">
                  Pronto para começar?
                </h4>
                <p className="text-muted-foreground mb-6">
                  Junte-se a centenas de clientes e autopeças que já usam o
                  PeçaJá
                </p>
                <Link to="/cadastrar">
                  <Button size="lg" className="w-full">
                    Cadastrar Agora
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default LandingPage;
