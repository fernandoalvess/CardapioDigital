"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { login } from "./actions";
import { loginSchema, type LoginFormValues } from "@/lib/validation/auth";

export function LoginForm({ initialError }: { initialError?: string }) {
  const [serverError, setServerError] = useState(initialError ?? "");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(data: LoginFormValues) {
    setServerError("");
    const result = await login(data);
    if (result?.error) {
      setServerError(result.error);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-6 grid gap-4" noValidate>
      {serverError && (
        <div className="rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-100">
          {serverError}
        </div>
      )}

      <label className="grid gap-2">
        <span className="text-sm font-bold">E-mail</span>
        <input
          type="email"
          autoComplete="username"
          placeholder="admin@exemplo.com"
          aria-invalid={Boolean(errors.email)}
          className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 outline-none transition placeholder:text-zinc-500 focus:border-orange-400 aria-invalid:border-red-400 aria-invalid:ring-2 aria-invalid:ring-red-400/20"
          {...register("email")}
        />
        {errors.email?.message && (
          <span className="text-xs font-medium text-red-400">
            {errors.email.message}
          </span>
        )}
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-bold">Senha</span>
        <input
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          aria-invalid={Boolean(errors.password)}
          className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 outline-none transition placeholder:text-zinc-500 focus:border-orange-400 aria-invalid:border-red-400 aria-invalid:ring-2 aria-invalid:ring-red-400/20"
          {...register("password")}
        />
        {errors.password?.message && (
          <span className="text-xs font-medium text-red-400">
            {errors.password.message}
          </span>
        )}
      </label>

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-xl bg-[var(--brand)] px-5 py-4 font-black transition hover:bg-[var(--brand-dark)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Entrando..." : "Entrar"}
      </button>

      <div className="mt-2 text-center">
        <Link
          href="/"
          className="text-sm font-bold text-orange-400 transition hover:underline"
        >
          Voltar ao cardápio
        </Link>
      </div>
    </form>
  );
}
