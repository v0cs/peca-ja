import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ImageUpload from "../ImageUpload";

describe("ImageUpload", () => {
  let onChangeMock;

  beforeEach(() => {
    onChangeMock = vi.fn();
    vi.clearAllMocks();
  });

  it("deve renderizar o componente corretamente", () => {
    render(<ImageUpload images={[]} onChange={onChangeMock} />);

    expect(screen.getByText(/Clique para upload/i)).toBeInTheDocument();
  });

  it("deve mostrar o número de imagens quando houver imagens", () => {
    const images = [
      new File(["content"], "image1.jpg", { type: "image/jpeg" }),
    ];

    render(<ImageUpload images={images} onChange={onChangeMock} />);

    expect(screen.getByText(/Imagens da Peça \(1\/3\)/i)).toBeInTheDocument();
  });

  it("deve permitir adicionar imagens através do input de arquivo", async () => {
    const file = new File(["content"], "test.jpg", { type: "image/jpeg" });
    const { container } = render(
      <ImageUpload images={[]} onChange={onChangeMock} />
    );

    const input = container.querySelector('input[type="file"]');
    expect(input).toBeInTheDocument();

    await waitFor(() => {
      fireEvent.change(input, {
        target: { files: [file] },
      });
    });

    expect(onChangeMock).toHaveBeenCalledWith([file]);
  });

  it("deve rejeitar arquivos com tipo inválido", async () => {
    const file = new File(["content"], "test.pdf", { type: "application/pdf" });
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});

    const { container } = render(
      <ImageUpload images={[]} onChange={onChangeMock} />
    );

    const input = container.querySelector('input[type="file"]');

    await waitFor(() => {
      fireEvent.change(input, {
        target: { files: [file] },
      });
    });

    expect(alertSpy).toHaveBeenCalled();
    expect(onChangeMock).not.toHaveBeenCalled();

    alertSpy.mockRestore();
  });

  it("deve rejeitar arquivos muito grandes (>5MB)", async () => {
    const largeFile = new File(["x".repeat(6 * 1024 * 1024)], "large.jpg", {
      type: "image/jpeg",
    });
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});

    const { container } = render(
      <ImageUpload images={[]} onChange={onChangeMock} />
    );

    const input = container.querySelector('input[type="file"]');

    await waitFor(() => {
      fireEvent.change(input, {
        target: { files: [largeFile] },
      });
    });

    expect(alertSpy).toHaveBeenCalled();
    expect(onChangeMock).not.toHaveBeenCalled();

    alertSpy.mockRestore();
  });

  it("deve permitir remover imagens", async () => {
    const images = [
      new File(["content"], "image1.jpg", { type: "image/jpeg" }),
      new File(["content"], "image2.jpg", { type: "image/jpeg" }),
    ];

    render(<ImageUpload images={images} onChange={onChangeMock} />);

    const removeButtons = screen.getAllByTitle(/Remover imagem/i);
    expect(removeButtons).toHaveLength(2);

    await waitFor(() => {
      fireEvent.click(removeButtons[0]);
    });

    expect(onChangeMock).toHaveBeenCalledWith([images[1]]);
  });

  it("deve limitar o número máximo de imagens", async () => {
    const images = [
      new File(["content"], "image1.jpg", { type: "image/jpeg" }),
      new File(["content"], "image2.jpg", { type: "image/jpeg" }),
      new File(["content"], "image3.jpg", { type: "image/jpeg" }),
    ];

    render(<ImageUpload images={images} onChange={onChangeMock} maxImages={3} />);

    expect(
      screen.queryByText(/Clique para upload/i)
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(/Limite de 3 imagem\(ns\) atingido/i)
    ).toBeInTheDocument();
  });

  it("deve mostrar mensagem de erro quando error prop é fornecida", () => {
    render(
      <ImageUpload
        images={[]}
        onChange={onChangeMock}
        error="Erro ao fazer upload"
      />
    );

    expect(screen.getByText(/Erro ao fazer upload/i)).toBeInTheDocument();
  });

  it("deve aceitar múltiplas imagens de uma vez", async () => {
    const files = [
      new File(["content"], "image1.jpg", { type: "image/jpeg" }),
      new File(["content"], "image2.jpg", { type: "image/jpeg" }),
    ];

    const { container } = render(
      <ImageUpload images={[]} onChange={onChangeMock} />
    );

    const input = container.querySelector('input[type="file"]');

    await waitFor(() => {
      fireEvent.change(input, {
        target: { files },
      });
    });

    expect(onChangeMock).toHaveBeenCalledWith(files);
  });
});

