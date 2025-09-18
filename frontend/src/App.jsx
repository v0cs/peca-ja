import React, { useState } from "react";

function App() {
  const [count, setCount] = useState(0);

  return (
    <div
      style={{
        padding: "50px",
        textAlign: "center",
        color: "white",
        backgroundColor: "#1a1a1a",
        minHeight: "100vh",
      }}
    >
      <h1 style={{ color: "#646cff", fontSize: "3rem" }}>PeçaJá</h1>
      <h2 style={{ color: "#888" }}>Marketplace de Autopeças</h2>
      <p>Frontend React + Vite funcionando! 🚀</p>
      <p>
        Backend rodando em:{" "}
        <code
          style={{
            backgroundColor: "#333",
            padding: "2px 6px",
            borderRadius: "4px",
          }}
        >
          http://localhost:3001
        </code>
      </p>

      <button
        onClick={() => setCount((count) => count + 1)}
        style={{
          padding: "12px 24px",
          backgroundColor: "#646cff",
          color: "white",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
          fontSize: "16px",
          marginTop: "20px",
        }}
      >
        Contador: {count}
      </button>
    </div>
  );
}

export default App;
