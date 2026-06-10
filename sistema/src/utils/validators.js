export const validators = {
  required: (value) => {
    if (!value || (typeof value === "string" && !value.trim())) {
      return "Campo obrigatório";
    }
    return null;
  },

  email: (value) => {
    if (!value) return null;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return "E-mail inválido";
    }
    return null;
  },

  minLength: (min) => (value) => {
    if (!value) return null;
    if (value.length < min) {
      return `Mínimo de ${min} caracteres`;
    }
    return null;
  },

  maxLength: (max) => (value) => {
    if (!value) return null;
    if (value.length > max) {
      return `Máximo de ${max} caracteres`;
    }
    return null;
  },

  min: (min) => (value) => {
    const num = Number.parseFloat(value);
    if (isNaN(num) || num < min) {
      return `Valor mínimo: ${min}`;
    }
    return null;
  },

  max: (max) => (value) => {
    const num = Number.parseFloat(value);
    if (isNaN(num) || num > max) {
      return `Valor máximo: ${max}`;
    }
    return null;
  },

  positive: (value) => {
    const num = Number.parseFloat(value);
    if (isNaN(num) || num <= 0) {
      return "Valor deve ser positivo";
    }
    return null;
  },

  cpf: (value) => {
    if (!value) return null;
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length !== 11) {
      return "CPF inválido";
    }
    // Validação básica de CPF
    if (/^(\d)\1{10}$/.test(cleaned)) {
      return "CPF inválido";
    }
    return null;
  },

  cnpj: (value) => {
    if (!value) return null;
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length !== 14) {
      return "CNPJ inválido";
    }
    return null;
  },

  phone: (value) => {
    if (!value) return null;
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length < 10 || cleaned.length > 11) {
      return "Telefone inválido";
    }
    return null;
  },
};

export const validate = (value, validatorList) => {
  for (const validator of validatorList) {
    const error = validator(value);
    if (error) return error;
  }
  return null;
};
