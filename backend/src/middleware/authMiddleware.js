const jwt = require("jsonwebtoken");
const config = require("../config/env");

/**
 * Middleware de autenticação JWT
 * Verifica e valida tokens JWT nas requisições
 */
const authMiddleware = (req, res, next) => {
  try {
    // 1. Tentar ler token do cookie primeiro (mais seguro)
    let token = req.cookies?.authToken;

    // 2. Se não encontrou no cookie, tentar do header Authorization (compatibilidade)
    if (!token) {
      const authHeader = req.headers.authorization;
      
      if (authHeader) {
        const parts = authHeader.split(" ");
        if (parts.length === 2 && parts[0] === "Bearer") {
          token = parts[1];
        }
      }
    }

    // 3. Se ainda não tem token, retornar erro
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token de acesso não fornecido",
        errors: {
          authorization: "Token de autenticação é obrigatório",
        },
      });
    }

    // 4. Verificar se o JWT_SECRET está configurado
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

    // 5. Verificar e decodificar o token
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

      // 6. Adicionar dados do usuário ao request
      req.user = {
        userId: decoded.userId,
        tipo: decoded.tipo,
      };

      // 7. Continuar para o próximo middleware/controller
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
