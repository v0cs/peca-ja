// Funções de validação de formulários

export const validarEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

export const validarCPF = (cpf) => {
  // Remove caracteres não numéricos
  const numeros = cpf.replace(/\D/g, "");

  if (numeros.length !== 11) return false;

  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1+$/.test(numeros)) return false;

  // Validação dos dígitos verificadores
  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(numeros.charAt(i)) * (10 - i);
  }
  let digito1 = 11 - (soma % 11);
  if (digito1 >= 10) digito1 = 0;

  if (parseInt(numeros.charAt(9)) !== digito1) return false;

  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(numeros.charAt(i)) * (11 - i);
  }
  let digito2 = 11 - (soma % 11);
  if (digito2 >= 10) digito2 = 0;

  return parseInt(numeros.charAt(10)) === digito2;
};

export const validarCNPJ = (cnpj) => {
  const numeros = cnpj.replace(/\D/g, "");
  if (numeros.length !== 14) return false;

  // Elimina CNPJs conhecidos como inválidos
  if (/^(\d)\1+$/.test(numeros)) return false;

  // Validação do primeiro dígito verificador
  let soma = 0;
  let peso = 5;
  for (let i = 0; i < 12; i++) {
    soma += parseInt(numeros.charAt(i)) * peso;
    peso = peso === 2 ? 9 : peso - 1;
  }
  let digito1 = soma % 11 < 2 ? 0 : 11 - (soma % 11);

  // Validação do segundo dígito verificador
  soma = 0;
  peso = 6;
  for (let i = 0; i < 13; i++) {
    soma += parseInt(numeros.charAt(i)) * peso;
    peso = peso === 2 ? 9 : peso - 1;
  }
  let digito2 = soma % 11 < 2 ? 0 : 11 - (soma % 11);

  return (
    parseInt(numeros.charAt(12)) === digito1 &&
    parseInt(numeros.charAt(13)) === digito2
  );
};

export const formatarCelular = (value) => {
  const numeros = value.replace(/\D/g, "");
  if (numeros.length <= 2) return `(${numeros}`;
  if (numeros.length <= 7) return `(${numeros.slice(0, 2)})${numeros.slice(2)}`;
  return `(${numeros.slice(0, 2)})${numeros.slice(2, 7)}-${numeros.slice(
    7,
    11
  )}`;
};

export const formatarTelefone = (value) => {
  const numeros = value.replace(/\D/g, "");
  if (numeros.length <= 2) return `(${numeros}`;
  if (numeros.length <= 6) return `(${numeros.slice(0, 2)})${numeros.slice(2)}`;
  return `(${numeros.slice(0, 2)})${numeros.slice(2, 6)}-${numeros.slice(
    6,
    10
  )}`;
};

export const formatarCEP = (value) => {
  const numeros = value.replace(/\D/g, "").slice(0, 8);
  if (numeros.length <= 5) return numeros;
  return `${numeros.slice(0, 5)}-${numeros.slice(5)}`;
};

export const formatarCPF = (value) => {
  const numeros = value.replace(/\D/g, "").slice(0, 11);
  if (numeros.length <= 3) return numeros;
  if (numeros.length <= 6) return `${numeros.slice(0, 3)}.${numeros.slice(3)}`;
  if (numeros.length <= 9)
    return `${numeros.slice(0, 3)}.${numeros.slice(3, 6)}.${numeros.slice(6)}`;
  return `${numeros.slice(0, 3)}.${numeros.slice(3, 6)}.${numeros.slice(
    6,
    9
  )}-${numeros.slice(9)}`;
};

export const formatarCNPJ = (value) => {
  const numeros = value.replace(/\D/g, "").slice(0, 14);
  if (numeros.length <= 2) return numeros;
  if (numeros.length <= 5) return `${numeros.slice(0, 2)}.${numeros.slice(2)}`;
  if (numeros.length <= 8)
    return `${numeros.slice(0, 2)}.${numeros.slice(2, 5)}.${numeros.slice(5)}`;
  if (numeros.length <= 12)
    return `${numeros.slice(0, 2)}.${numeros.slice(2, 5)}.${numeros.slice(
      5,
      8
    )}/${numeros.slice(8)}`;
  return `${numeros.slice(0, 2)}.${numeros.slice(2, 5)}.${numeros.slice(
    5,
    8
  )}/${numeros.slice(8, 12)}-${numeros.slice(12)}`;
};
