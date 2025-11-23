import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { useState } from "react";
import VehicleForm from "../VehicleForm";
import api from "../../../services/api";

// Mock do api
vi.mock("../../../services/api", () => ({
  default: {
    get: vi.fn(),
    defaults: {
      headers: {
        common: {},
      },
    },
    interceptors: {
      request: {
        use: vi.fn(),
      },
      response: {
        use: vi.fn(),
      },
    },
  },
}));

// Mock do localStorage
const localStorageMock = {
  getItem: vi.fn(() => "test-token"),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

describe("VehicleForm", () => {
  const mockOnChange = vi.fn();
  const mockFormData = {
    placa: "",
    marca: "",
    modelo: "",
    ano_fabricacao: "",
    ano_modelo: "",
    categoria: "",
    cor: "",
    chassi: "",
    renavam: "",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve renderizar todos os campos do formulário", () => {
    // Act
    render(
      <VehicleForm formData={mockFormData} onChange={mockOnChange} errors={{}} />
    );

    // Assert - Usar função de matcher para normalizar texto dos labels (ignora asteriscos e espaços)
    const normalizeLabel = (text) => text?.trim().replace(/\s+/g, ' ').replace(/\s*\*+\s*$/, '').toLowerCase();
    
    expect(screen.getByLabelText(/placa do veículo/i)).toBeInTheDocument();
    expect(screen.getByLabelText((content) => normalizeLabel(content) === 'marca')).toBeInTheDocument();
    // Para "Modelo", verificar que é exatamente "Modelo" e não "Ano do Modelo"
    expect(screen.getByLabelText((content) => {
      const normalized = normalizeLabel(content);
      return normalized === 'modelo' && !content.toLowerCase().includes('ano');
    })).toBeInTheDocument();
    expect(screen.getByLabelText(/ano de fabricação/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/ano do modelo/i)).toBeInTheDocument();
    expect(screen.getByLabelText((content) => normalizeLabel(content) === 'categoria')).toBeInTheDocument();
    expect(screen.getByLabelText((content) => normalizeLabel(content) === 'cor')).toBeInTheDocument();
  });

  it("deve permitir preencher campos do formulário", () => {
    // Arrange
    render(
      <VehicleForm formData={mockFormData} onChange={mockOnChange} errors={{}} />
    );

    const placaInput = screen.getByLabelText(/placa do veículo/i);
    const marcaInput = screen.getByLabelText(/marca/i);

    // Act
    fireEvent.change(placaInput, { target: { value: "ABC1234" } });
    fireEvent.change(marcaInput, { target: { value: "Volkswagen" } });

    // Assert
    expect(mockOnChange).toHaveBeenCalled();
  });

  it("deve consultar API quando placa válida é digitada", async () => {
    // Arrange
    const mockResponse = {
      data: {
        success: true,
        data: {
          veiculo: {
            placa: "ABC1234",
            marca: "Volkswagen",
            modelo: "Golf",
            ano_fabricacao: 2020,
            ano_modelo: 2021,
            cor: "Branco",
            origem_dados_veiculo: "api",
          },
        },
      },
    };

    api.get.mockResolvedValue(mockResponse);

    // Wrapper com estado para simular mudança de formData
    const TestWrapper = () => {
      const [formData, setFormData] = useState(mockFormData);
      const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
        mockOnChange(e);
      };
      return <VehicleForm formData={formData} onChange={handleChange} errors={{}} />;
    };

    render(<TestWrapper />);

    const placaInput = screen.getByLabelText(/placa do veículo/i);

    // Act - Simular digitação da placa
    fireEvent.change(placaInput, { target: { value: "ABC1234" } });

    // Aguardar o debounce de 1 segundo
    await new Promise(resolve => setTimeout(resolve, 1100));

    // Assert - Verificar que a API foi chamada após o debounce
    await waitFor(
      () => {
        expect(api.get).toHaveBeenCalled();
        // Verificar que foi chamada com a placa normalizada (sem hífen)
        const calls = api.get.mock.calls;
        const placaCall = calls.find(call => 
          call[0]?.includes("ABC1234")
        );
        expect(placaCall).toBeDefined();
      },
      { timeout: 3000 }
    );
  });

  it("deve preencher campos automaticamente quando API retorna dados", async () => {
    // Arrange
    const mockResponse = {
      data: {
        success: true,
        data: {
          veiculo: {
            placa: "ABC1234",
            marca: "Volkswagen",
            modelo: "Golf",
            ano_fabricacao: 2020,
            ano_modelo: 2021,
            cor: "Branco",
            origem_dados_veiculo: "api",
          },
        },
      },
    };

    api.get.mockResolvedValue(mockResponse);

    // Wrapper com estado para simular mudança de formData
    const TestWrapper = () => {
      const [formData, setFormData] = useState(mockFormData);
      const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
        mockOnChange(e);
      };
      return <VehicleForm formData={formData} onChange={handleChange} errors={{}} />;
    };

    render(<TestWrapper />);

    const placaInput = screen.getByLabelText(/placa do veículo/i);

    // Act - Simular digitação da placa
    fireEvent.change(placaInput, { target: { value: "ABC1234" } });

    // Aguardar o debounce de 1 segundo
    await new Promise(resolve => setTimeout(resolve, 1100));

    // Assert - Verificar que onChange foi chamado para preencher os campos
    await waitFor(
      () => {
        // Verificar que a API foi chamada
        expect(api.get).toHaveBeenCalled();
        // Verificar que onChange foi chamado (pode ser chamado múltiplas vezes para diferentes campos)
        expect(mockOnChange).toHaveBeenCalled();
        // Verificar que pelo menos um dos calls foi para preencher a marca
        const calls = mockOnChange.mock.calls;
        const marcaCall = calls.find(call => 
          call[0]?.target?.name === "marca" && call[0]?.target?.value === "Volkswagen"
        );
        expect(marcaCall).toBeDefined();
      },
      { timeout: 3000 }
    );
  });

  it("deve exibir erro quando consulta de placa falha", async () => {
    // Arrange
    const mockError = {
      response: {
        status: 404,
        data: {
          success: false,
          message: "Placa não encontrada",
        },
      },
    };

    api.get.mockRejectedValue(mockError);

    // Wrapper com estado para simular mudança de formData
    const TestWrapper = () => {
      const [formData, setFormData] = useState(mockFormData);
      const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
        mockOnChange(e);
      };
      return <VehicleForm formData={formData} onChange={handleChange} errors={{}} />;
    };

    render(<TestWrapper />);

    const placaInput = screen.getByLabelText(/placa do veículo/i);

    // Act
    fireEvent.change(placaInput, { target: { value: "ABC1234" } });

    // Aguardar o debounce de 1 segundo
    await new Promise(resolve => setTimeout(resolve, 1100));

    // Assert - Verificar que a API foi chamada e erro foi exibido
    await waitFor(
      () => {
        expect(api.get).toHaveBeenCalled();
      },
      { timeout: 3000 }
    );

    // Aguardar um pouco mais para o erro aparecer na tela
    await new Promise(resolve => setTimeout(resolve, 500));

    // Verificar se mensagem de erro aparece na tela (pode ser a mensagem específica ou a padrão)
    const errorMessage = screen.queryByText(/placa não encontrada|não foi possível consultar/i);
    expect(errorMessage).toBeInTheDocument();
  });

  it("deve exibir erros de validação quando fornecidos", () => {
    // Arrange
    const errors = {
      placa: "Placa inválida",
      marca: "Marca é obrigatória",
    };

    render(
      <VehicleForm
        formData={mockFormData}
        onChange={mockOnChange}
        errors={errors}
      />
    );

    // Assert - Erros devem ser exibidos
    expect(screen.getByText(/placa inválida/i)).toBeInTheDocument();
    expect(screen.getByText(/marca é obrigatória/i)).toBeInTheDocument();
  });

  it("não deve consultar API para placas muito curtas", async () => {
    // Arrange
    // Wrapper com estado para simular mudança de formData
    const TestWrapper = () => {
      const [formData, setFormData] = useState(mockFormData);
      const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
        mockOnChange(e);
      };
      return <VehicleForm formData={formData} onChange={handleChange} errors={{}} />;
    };

    render(<TestWrapper />);

    const placaInput = screen.getByLabelText(/placa do veículo/i);

    // Act
    fireEvent.change(placaInput, { target: { value: "ABC" } });

    // Aguardar o debounce de 1 segundo
    await new Promise(resolve => setTimeout(resolve, 1100));

    // Assert - API não deve ser chamada para placas muito curtas
    await waitFor(() => {
      expect(api.get).not.toHaveBeenCalled();
    }, { timeout: 2000 });
  });

  it("deve normalizar placa removendo hífen", async () => {
    // Arrange
    const mockResponse = {
      data: {
        success: true,
        data: {
          veiculo: {
            placa: "ABC1234",
            marca: "Volkswagen",
            origem_dados_veiculo: "api",
          },
        },
      },
    };

    api.get.mockResolvedValue(mockResponse);

    // Wrapper com estado para simular mudança de formData
    const TestWrapper = () => {
      const [formData, setFormData] = useState(mockFormData);
      const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
        mockOnChange(e);
      };
      return <VehicleForm formData={formData} onChange={handleChange} errors={{}} />;
    };

    render(<TestWrapper />);

    const placaInput = screen.getByLabelText(/placa do veículo/i);

    // Act - Digitar placa com hífen
    fireEvent.change(placaInput, { target: { value: "ABC-1234" } });

    // Aguardar o debounce de 1 segundo
    await new Promise(resolve => setTimeout(resolve, 1100));

    // Assert - API deve ser chamada com placa normalizada (sem hífen)
    await waitFor(
      () => {
        expect(api.get).toHaveBeenCalled();
        // Verificar que foi chamada com a placa normalizada (sem hífen)
        const calls = api.get.mock.calls;
        const placaCall = calls.find(call => 
          call[0]?.includes("ABC1234")
        );
        expect(placaCall).toBeDefined();
      },
      { timeout: 3000 }
    );
  });
});

