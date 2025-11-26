const {
  getClientIp,
} = require("../../../src/middleware/rateLimitMiddleware");

describe("rateLimitMiddleware - getClientIp", () => {
  it("deve retornar req.ip quando disponível", () => {
    const req = {
      ip: "192.168.1.1",
    };
    expect(getClientIp(req)).toBe("192.168.1.1");
  });

  it("deve retornar req.connection.remoteAddress quando req.ip não está disponível", () => {
    const req = {
      connection: {
        remoteAddress: "192.168.1.2",
      },
    };
    expect(getClientIp(req)).toBe("192.168.1.2");
  });

  it("deve retornar req.socket.remoteAddress quando outras opções não estão disponíveis", () => {
    const req = {
      socket: {
        remoteAddress: "192.168.1.3",
      },
    };
    expect(getClientIp(req)).toBe("192.168.1.3");
  });

  it("deve retornar req.connection.socket.remoteAddress quando disponível", () => {
    const req = {
      connection: {
        socket: {
          remoteAddress: "192.168.1.4",
        },
      },
    };
    expect(getClientIp(req)).toBe("192.168.1.4");
  });

  it("deve retornar primeiro IP de x-forwarded-for quando disponível", () => {
    const req = {
      headers: {
        "x-forwarded-for": "192.168.1.5, 10.0.0.1, 172.16.0.1",
      },
    };
    expect(getClientIp(req)).toBe("192.168.1.5");
  });

  it("deve retornar x-real-ip quando disponível", () => {
    const req = {
      headers: {
        "x-real-ip": "192.168.1.6",
      },
    };
    expect(getClientIp(req)).toBe("192.168.1.6");
  });

  it("deve retornar 'unknown' quando nenhuma opção está disponível", () => {
    const req = {
      headers: {},
    };
    expect(getClientIp(req)).toBe("unknown");
  });

  it("deve priorizar req.ip sobre outras opções", () => {
    const req = {
      ip: "192.168.1.1",
      connection: {
        remoteAddress: "192.168.1.2",
      },
      headers: {
        "x-forwarded-for": "192.168.1.3",
        "x-real-ip": "192.168.1.4",
      },
    };
    expect(getClientIp(req)).toBe("192.168.1.1");
  });

  it("deve tratar x-forwarded-for como string corretamente", () => {
    const req = {
      headers: {
        "x-forwarded-for": "192.168.1.7",
      },
    };
    expect(getClientIp(req)).toBe("192.168.1.7");
  });

  it("deve ignorar x-forwarded-for quando não é string", () => {
    const req = {
      headers: {
        "x-forwarded-for": ["192.168.1.8"],
        "x-real-ip": "192.168.1.9",
      },
    };
    expect(getClientIp(req)).toBe("192.168.1.9");
  });

  it("deve remover espaços do x-forwarded-for", () => {
    const req = {
      headers: {
        "x-forwarded-for": "  192.168.1.10  , 10.0.0.1",
      },
    };
    expect(getClientIp(req)).toBe("192.168.1.10");
  });
});

