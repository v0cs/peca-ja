import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ImageGallery from "../ImageGallery";

// Mock do api
vi.mock("../../../services/api", () => ({
  default: {
    defaults: {
      baseURL: "http://localhost:3001/api",
    },
  },
}));

describe("ImageGallery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve exibir mensagem quando não há imagens", () => {
    render(<ImageGallery images={[]} />);
    expect(screen.getByText("Nenhuma imagem disponível")).toBeInTheDocument();
  });

  it("deve exibir mensagem quando images é null", () => {
    render(<ImageGallery images={null} />);
    expect(screen.getByText("Nenhuma imagem disponível")).toBeInTheDocument();
  });

  it("deve renderizar imagens quando fornecidas", () => {
    const images = [
      { id: 1, url: "/uploads/image1.jpg" },
      { id: 2, url: "/uploads/image2.jpg" },
    ];

    render(<ImageGallery images={images} />);
    
    const imageElements = screen.getAllByAltText(/Imagem \d+/);
    expect(imageElements).toHaveLength(2);
  });

  it("deve abrir lightbox ao clicar em uma imagem", async () => {
    const images = [
      { id: 1, url: "/uploads/image1.jpg" },
      { id: 2, url: "/uploads/image2.jpg" },
    ];

    render(<ImageGallery images={images} />);
    
    const firstImage = screen.getAllByAltText(/Imagem \d+/)[0];
    fireEvent.click(firstImage);

    await waitFor(() => {
      // Verificar se o lightbox foi aberto (contador deve aparecer)
      expect(screen.getByText(/1\s*\/\s*2/)).toBeInTheDocument();
    });
  });

  it("deve fechar lightbox ao clicar no botão de fechar", async () => {
    const images = [
      { id: 1, url: "/uploads/image1.jpg" },
    ];

    const { container } = render(<ImageGallery images={images} />);
    
    const image = screen.getByAltText(/Imagem \d+/);
    fireEvent.click(image);

    await waitFor(() => {
      // Verificar que o lightbox está aberto (buscar pelo botão de fechar)
      const closeButton = container.querySelector('button svg.lucide-x')?.closest('button');
      expect(closeButton).toBeInTheDocument();
    });

    // Buscar o botão de fechar pelo SVG X dentro dele e clicar
    const closeButton = container.querySelector('button svg.lucide-x')?.closest('button');
    if (closeButton) {
      fireEvent.click(closeButton);
    }

    await waitFor(() => {
      // O botão de fechar não deve mais estar visível
      const closeButtonAfter = container.querySelector('button svg.lucide-x')?.closest('button');
      expect(closeButtonAfter).toBeFalsy();
    }, { timeout: 1000 });
  });

  it("deve navegar para próxima imagem quando há múltiplas imagens", async () => {
    const images = [
      { id: 1, url: "/uploads/image1.jpg" },
      { id: 2, url: "/uploads/image2.jpg" },
      { id: 3, url: "/uploads/image3.jpg" },
    ];

    const { container } = render(<ImageGallery images={images} />);
    
    const firstImage = screen.getAllByAltText(/Imagem \d+/)[0];
    fireEvent.click(firstImage);

    await waitFor(() => {
      // Verificar que o lightbox está aberto (buscar pelo botão próximo)
      const nextButton = container.querySelector('button svg.lucide-chevron-right')?.closest('button');
      expect(nextButton).toBeInTheDocument();
    });

    // Clicar no botão próximo (ChevronRight) - buscar pelo SVG dentro do botão
    const nextButton = container.querySelector('button svg.lucide-chevron-right')?.closest('button');
    if (nextButton) {
      fireEvent.click(nextButton);
    }

    // Verificar que a navegação funcionou (contador deve mostrar 2/3)
    await waitFor(() => {
      expect(screen.getByText(/2\s*\/\s*3/)).toBeInTheDocument();
    });
  });

  it("deve exibir contador de imagens no lightbox", async () => {
    const images = [
      { id: 1, url: "/uploads/image1.jpg" },
      { id: 2, url: "/uploads/image2.jpg" },
    ];

    render(<ImageGallery images={images} />);
    
    const firstImage = screen.getAllByAltText(/Imagem \d+/)[0];
    fireEvent.click(firstImage);

    await waitFor(() => {
      expect(screen.getByText(/1\s*\/\s*2/)).toBeInTheDocument();
    });
  });

  it("deve exibir mensagem de erro quando imagem falha ao carregar", async () => {
    const images = [
      { id: 1, url: "/uploads/invalid-image.jpg" },
    ];

    render(<ImageGallery images={images} />);
    
    const image = screen.getByAltText(/Imagem \d+/);
    
    // Simular erro ao carregar imagem
    fireEvent.error(image);

    await waitFor(() => {
      expect(screen.getByText("Erro ao carregar imagem")).toBeInTheDocument();
    });
  });

  it("deve construir URL correta para imagens com path relativo", () => {
    const images = [
      { id: 1, url: "/uploads/image1.jpg" },
    ];

    const { container } = render(<ImageGallery images={images} />);
    const img = container.querySelector("img");
    expect(img).toBeInTheDocument();
    expect(img.src).toContain("/uploads/image1.jpg");
  });

  it("deve usar nome_arquivo_fisico quando url não está disponível", () => {
    const images = [
      { id: 1, nome_arquivo_fisico: "image1.jpg" },
    ];

    const { container } = render(<ImageGallery images={images} />);
    const img = container.querySelector("img");
    expect(img).toBeInTheDocument();
    expect(img.src).toContain("/uploads/image1.jpg");
  });
});

