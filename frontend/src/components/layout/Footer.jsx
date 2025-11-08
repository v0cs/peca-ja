import { Car } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t bg-card/30 py-8 mt-auto">
      <div className="container mx-auto px-4 text-center">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <Car className="h-6 w-6 text-primary" />
          <span className="text-lg font-semibold">PeçaJá</span>
        </div>
        <p className="text-muted-foreground">
          Conectando você às melhores autopeças da sua cidade
        </p>
        <p className="text-muted-foreground text-sm mt-2">
          © {new Date().getFullYear()} PeçaJá. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
