const jwt = require("jsonwebtoken");
const config = require("../config/env");

/**
 * Middleware de autenticação JWT
 * Verifica e valida tokens JWT nas requisições
 */
const authMiddleware = (req, res, next) => {
  try {
    // 1. Verificar se o header Authorization existe
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Token de acesso não fornecido",
        errors: {
          authorization: "Header Authorization é obrigatório",
        },
      });
    }

    // 2. Verificar se o formato está correto (Bearer <token>)
    const parts = authHeader.split(" ");

    if (parts.length !== 2 || parts[0] !== "Bearer") {
      return res.status(401).json({
        success: false,
        message: "Formato de token inválido",
        errors: {
          authorization: "Formato esperado: Bearer <token>",
        },
      });
    }

    const token = parts[1];

    // 3. Verificar se o JWT_SECRET está configurado
    const jwtSecret = config.JWT_SECRET;
    if (!jwtSecret) {
      console.error("JWT_SECRET não configurado");
      return res.status(500).json({
        success: false,
        message: "Erro de configuração do servidor",
        errors: {
          message: "Configuração de segurança não encontrada",
        },
      });
    }

    // 4. Verificar e decodificar o token
    jwt.verify(token, jwtSecret, (err, decoded) => {
      if (err) {
        // Verificar se é erro de expiração
        if (err.name === "TokenExpiredError") {
          return res.status(401).json({
            success: false,
            message: "Token expirado",
            errors: {
              token: "Seu token de acesso expirou. Faça login novamente.",
            },
          });
        }

        // Outros erros de token (inválido, malformado, etc.)
        return res.status(401).json({
          success: false,
          message: "Token inválido",
          errors: {
            token: "Token de acesso inválido ou malformado",
          },
        });
      }

      // 5. Adicionar dados do usuário ao request
      req.user = {
        userId: decoded.userId,
        tipo: decoded.tipo,
      };

      // 6. Continuar para o próximo middleware/controller
      next();
    });
  } catch (error) {
    console.error("Erro no middleware de autenticação:", error);

    return res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
      errors: {
        message: "Ocorreu um erro inesperado durante a autenticação",
      },
    });
  }
};

module.exports = authMiddleware;
