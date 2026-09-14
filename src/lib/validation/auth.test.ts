import { describe, expect, it } from "vitest";
import { loginSchema } from "@/lib/validation/auth";

describe("validação de login", () => {
  it("aceita credenciais válidas", () => {
    const result = loginSchema.safeParse({
      email: "admin@fbburguer.com",
      password: "secretpassword123",
    });

    expect(result.success).toBe(true);
  });

  it("recusa e-mail vazio", () => {
    const result = loginSchema.safeParse({
      email: "",
      password: "secretpassword123",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Informe seu e-mail.");
    }
  });

  it("recusa formato de e-mail inválido", () => {
    const result = loginSchema.safeParse({
      email: "email-invalido",
      password: "secretpassword123",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Informe um e-mail válido.");
    }
  });

  it("recusa senha vazia", () => {
    const result = loginSchema.safeParse({
      email: "admin@fbburguer.com",
      password: "",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Informe sua senha.");
    }
  });
});
