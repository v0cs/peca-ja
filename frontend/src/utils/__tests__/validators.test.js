import {
  validarEmail,
  validarCNPJ,
  formatarCelular,
  formatarTelefone,
  formatarCEP,
  formatarCNPJ,
} from "../validators";

describe("validators", () => {
  describe("validarEmail", () => {
    it("deve retornar true para email válido", () => {
      expect(validarEmail("teste@exemplo.com")).toBe(true);
      expect(validarEmail("usuario.nome@dominio.com.br")).toBe(true);
      expect(validarEmail("a@b.co")).toBe(true);
    });

    it("deve retornar false para email inválido", () => {
      expect(validarEmail("email-invalido")).toBe(false);
      expect(validarEmail("@dominio.com")).toBe(false);
      expect(validarEmail("usuario@")).toBe(false);
      expect(validarEmail("usuario@dominio")).toBe(false);
      expect(validarEmail("")).toBe(false);
      expect(validarEmail("usuario @dominio.com")).toBe(false);
    });
  });

  describe("validarCNPJ", () => {
    it("deve retornar true para CNPJ válido", () => {
      // CNPJ válido de exemplo (11.222.333/0001-81)
      expect(validarCNPJ("11222333000181")).toBe(true);
      expect(validarCNPJ("11.222.333/0001-81")).toBe(true);
    });

    it("deve retornar false para CNPJ inválido", () => {
      expect(validarCNPJ("00000000000000")).toBe(false); // Todos os dígitos iguais
      expect(validarCNPJ("11111111111111")).toBe(false); // Todos os dígitos iguais
      expect(validarCNPJ("12345678901234")).toBe(false); // Dígitos verificadores inválidos
      expect(validarCNPJ("123456789012")).toBe(false); // Menos de 14 dígitos
      expect(validarCNPJ("")).toBe(false);
    });
  });

  describe("formatarCelular", () => {
    it("deve formatar número de celular corretamente", () => {
      expect(formatarCelular("11987654321")).toBe("(11)98765-4321");
      expect(formatarCelular("1198765432")).toBe("(11)98765-432");
      expect(formatarCelular("11")).toBe("(11");
      expect(formatarCelular("1198765")).toBe("(11)98765");
    });

    it("deve remover caracteres não numéricos antes de formatar", () => {
      expect(formatarCelular("(11)98765-4321")).toBe("(11)98765-4321");
      expect(formatarCelular("11 98765 4321")).toBe("(11)98765-4321");
    });

    it("deve lidar com strings vazias", () => {
      expect(formatarCelular("")).toBe("(");
    });
  });

  describe("formatarTelefone", () => {
    it("deve formatar número de telefone corretamente", () => {
      expect(formatarTelefone("1134567890")).toBe("(11)3456-7890");
      expect(formatarTelefone("11345678")).toBe("(11)3456-78");
      expect(formatarTelefone("11")).toBe("(11");
      expect(formatarTelefone("113456")).toBe("(11)3456");
    });

    it("deve remover caracteres não numéricos antes de formatar", () => {
      expect(formatarTelefone("(11)3456-7890")).toBe("(11)3456-7890");
      expect(formatarTelefone("11 3456 7890")).toBe("(11)3456-7890");
    });

    it("deve lidar com strings vazias", () => {
      expect(formatarTelefone("")).toBe("(");
    });
  });

  describe("formatarCEP", () => {
    it("deve formatar CEP corretamente", () => {
      expect(formatarCEP("12345678")).toBe("12345-678");
      expect(formatarCEP("1234567")).toBe("12345-67");
      expect(formatarCEP("12345")).toBe("12345");
      expect(formatarCEP("123")).toBe("123");
    });

    it("deve remover caracteres não numéricos antes de formatar", () => {
      expect(formatarCEP("12345-678")).toBe("12345-678");
      expect(formatarCEP("12345 678")).toBe("12345-678");
    });

    it("deve limitar a 8 dígitos", () => {
      expect(formatarCEP("123456789012")).toBe("12345-678");
    });

    it("deve lidar com strings vazias", () => {
      expect(formatarCEP("")).toBe("");
    });
  });

  describe("formatarCNPJ", () => {
    it("deve formatar CNPJ corretamente", () => {
      expect(formatarCNPJ("11222333000181")).toBe("11.222.333/0001-81");
      expect(formatarCNPJ("112223330001")).toBe("11.222.333/0001");
      expect(formatarCNPJ("11222333")).toBe("11.222.333");
      expect(formatarCNPJ("11222")).toBe("11.222");
      expect(formatarCNPJ("11")).toBe("11");
    });

    it("deve remover caracteres não numéricos antes de formatar", () => {
      expect(formatarCNPJ("11.222.333/0001-81")).toBe("11.222.333/0001-81");
      expect(formatarCNPJ("11 222 333 0001 81")).toBe("11.222.333/0001-81");
    });

    it("deve limitar a 14 dígitos", () => {
      expect(formatarCNPJ("11222333000181123456")).toBe("11.222.333/0001-81");
    });

    it("deve lidar com strings vazias", () => {
      expect(formatarCNPJ("")).toBe("");
    });
  });
});




