const validator = require("validator");

const sanitizeEmail = (value) =>
  typeof value === "string" ? value.trim() : "";

const isValidEmail = (value) => {
  const normalized = sanitizeEmail(value);
  if (!normalized) {
    return false;
  }

  return validator.isEmail(normalized, {
    allow_utf8_local_part: false,
    require_tld: true,
  });
};

module.exports = {
  isValidEmail,
  sanitizeEmail,
};

