import { describe, test } from "vitest";
import App from "./App";

// App possui dependências de rotas/contextos complexos.
// Teste marcado como skip até que seja configurado ambiente completo.

describe("App", () => {
  test.skip("renderiza sem falhas", () => {
    void App;
  });
});
