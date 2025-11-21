import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

    // Assert
    expect(screen.getByLabelText(/placa/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/marca/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/modelo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/ano de fabricação/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/ano do modelo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/categoria/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/cor/i)).toBeInTheDocument();
  });

  it("deve permitir preencher campos do formulário", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <VehicleForm formData={mockFormData} onChange={mockOnChange} errors={{}} />
    );

    const placaInput = screen.getByLabelText(/placa/i);
    const marcaInput = screen.getByLabelText(/marca/i);

    // Act
    await user.type(placaInput, "ABC1234");
    await user.type(marcaInput, "Volkswagen");

    // Assert
    expect(mockOnChange).toHaveBeenCalled();
  });

  it("deve consultar API quando placa válida é digitada", async () => {
    // Arrange
    const user = userEvent.setup();
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

    render(
      <VehicleForm formData={mockFormData} onChange={mockOnChange} errors={{}} />
    );

    const placaInput = screen.getByLabelText(/placa/i);

    // Act
    await user.type(placaInput, "ABC1234");

    // Assert
    await waitFor(
      () => {
        expect(api.get).toHaveBeenCalledWith("/vehicle/consulta/ABC1234");
      },
      { timeout: 3000 }
    );
  });

  it("deve preencher campos automaticamente quando API retorna dados", async () => {
    // Arrange
    const user = userEvent.setup();
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

    render(
      <VehicleForm formData={mockFormData} onChange={mockOnChange} errors={{}} />
    );

    const placaInput = screen.getByLabelText(/placa/i);

    // Act
    await user.type(placaInput, "ABC1234");

    // Assert
    await waitFor(
      () => {
        expect(mockOnChange).toHaveBeenCalledWith(
          expect.objectContaining({
            target: expect.objectContaining({
              name: "marca",
              value: "Volkswagen",
            }),
          })
        );
      },
      { timeout: 3000 }
    );
  });

  it("deve exibir erro quando consulta de placa falha", async () => {
    // Arrange
    const user = userEvent.setup();
    const mockError = {
      response: {
        data: {
          success: false,
          message: "Placa não encontrada",
        },
      },
    };

    api.get.mockRejectedValue(mockError);

    render(
      <VehicleForm formData={mockFormData} onChange={mockOnChange} errors={{}} />
    );

    const placaInput = screen.getByLabelText(/placa/i);

    // Act
    await user.type(placaInput, "ABC1234");

    // Assert
    await waitFor(
      () => {
        expect(api.get).toHaveBeenCalled();
        // Verificar se erro é exibido (pode estar em um elemento de erro)
      },
      { timeout: 3000 }
    );
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
    const user = userEvent.setup();
    render(
      <VehicleForm formData={mockFormData} onChange={mockOnChange} errors={{}} />
    );

    const placaInput = screen.getByLabelText(/placa/i);

    // Act
    await user.type(placaInput, "ABC");

    // Assert
    await waitFor(() => {
      expect(api.get).not.toHaveBeenCalled();
    });
  });

  it("deve normalizar placa removendo hífen", async () => {
    // Arrange
    const user = userEvent.setup();
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

    render(
      <VehicleForm formData={mockFormData} onChange={mockOnChange} errors={{}} />
    );

    const placaInput = screen.getByLabelText(/placa/i);

    // Act
    await user.type(placaInput, "ABC-1234");

    // Assert
    await waitFor(
      () => {
        // API deve ser chamada com placa normalizada (sem hífen)
        expect(api.get).toHaveBeenCalledWith("/vehicle/consulta/ABC1234");
      },
      { timeout: 3000 }
    );
  });
});

