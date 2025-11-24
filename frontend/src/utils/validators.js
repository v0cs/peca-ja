// Funções de validação de formulários
import isEmail from "validator/lib/isEmail.js";

export const validarEmail = (email) => {
  if (typeof email !== "string") {
    return false;
  }

  return isEmail(email.trim(), {
    allow_utf8_local_part: false,
    require_tld: true,
  });
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
