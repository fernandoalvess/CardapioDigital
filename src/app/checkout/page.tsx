"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown, ChevronLeft, ChevronUp, ImageOff } from "lucide-react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { NumericFormat, PatternFormat } from "react-number-format";
import { useState } from "react";
import { useCart } from "@/stores/cart-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { useStoreStatus } from "@/hooks/use-store-status";
import { formatBRL } from "@/lib/format";
import {
  checkoutFormSchema,
  type CheckoutFormValues,
} from "@/lib/validation/checkout";

export default function CheckoutPage() {
  const cart = useCart();
  const [serverError, setServerError] = useState("");
  const [showAllItems, setShowAllItems] = useState(false);
  const {
    data: storeData,
    error: storeError,
    isPending: checkingStore,
    refetch: refetchStoreStatus,
  } = useStoreStatus();

  const {
    register,
    control,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      customerName: "",
      phone: "",
      address: "",
      cashChangeFor: "",
      notes: "",
      website: "",
    },
  });

  const paymentMethod = useWatch({ control, name: "paymentMethod" });

  const storeAvailability = checkingStore
    ? {
        state: "checking" as const,
        message: "Verificando o horário de funcionamento...",
      }
    : storeError
      ? {
          state: "error" as const,
          message:
            storeError instanceof Error
              ? storeError.message
              : "Não foi possível confirmar o horário da FB Burguer agora.",
        }
      : {
          state: storeData?.isOpen ? ("open" as const) : ("closed" as const),
          message:
            storeData?.message ??
            "Não foi possível confirmar o horário da FB Burguer agora.",
        };

  const visibleItems = showAllItems ? cart.items : cart.items.slice(0, 5);
  const hiddenItemsCount = Math.max(0, cart.items.length - 5);

  async function submit(values: CheckoutFormValues) {
    setServerError("");
    clearErrors("cashChangeFor");

    if (!cart.items.length) return;

    if (storeAvailability.state !== "open") {
      setServerError(
        storeAvailability.message || "A FB Burguer está fechada no momento.",
      );
      return;
    }

    const latestResult = await refetchStoreStatus();
    const latestAvailability = latestResult.data;
    if (!latestAvailability?.isOpen) {
      setServerError(
        latestAvailability?.message ??
          (latestResult.error instanceof Error
            ? latestResult.error.message
            : "Não foi possível confirmar o horário da FB Burguer agora."),
      );
      return;
    }

    const parsedCashChange =
      values.paymentMethod === "cash" && values.cashChangeFor
        ? Number(values.cashChangeFor)
        : null;

    if (
      values.paymentMethod === "cash" &&
      parsedCashChange !== null &&
      Number.isFinite(parsedCashChange) &&
      parsedCashChange < cart.subtotal
    ) {
      setError("cashChangeFor", {
        type: "validate",
        message:
          "O valor informado para troco deve ser igual ou maior que o total do pedido.",
      });
      return;
    }

    const payload = {
      customerName: values.customerName,
      phone: values.phone,
      address: values.address,
      paymentMethod: values.paymentMethod,
      cashChangeFor:
        values.paymentMethod === "cash" && Number.isFinite(parsedCashChange)
          ? parsedCashChange
          : null,
      notes: values.notes,
      website: values.website,
      items: cart.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
    };

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        setServerError(
          result.error ??
            "Não foi possível registrar a comanda. O pedido não foi encaminhado ao WhatsApp.",
        );
        return;
      }

      if (!result.whatsappUrl) {
        setServerError(
          "A comanda foi criada, mas o WhatsApp da loja não está configurado.",
        );
        return;
      }

      cart.clear();
      window.location.assign(result.whatsappUrl);
    } catch {
      setServerError("Falha de conexão. Verifique sua internet e tente novamente.");
    }
  }

  return (
    <main className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="container-app flex h-16 items-center gap-3">
          <Link
            href="/"
            aria-label="Voltar para o cardápio"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-zinc-700 transition hover:bg-zinc-100"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <Image
            src="/brand/logo.webp"
            alt="FB Burguer"
            width={38}
            height={38}
            className="h-9 w-9 rounded-lg object-cover"
          />
          <strong>FB Burguer</strong>
        </div>
      </header>

      <div className="container-app py-7 md:py-10">
        <div className="mb-5">
          <h1 className="text-2xl font-black tracking-tight">Finalizar pedido</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Revise sua sacola e informe os dados para enviar o pedido.
          </p>
        </div>

        {storeAvailability.state !== "open" && (
          <div
            className={`mb-5 rounded-2xl border p-4 text-sm leading-6 ${
              storeAvailability.state === "checking"
                ? "border-zinc-200 bg-white text-zinc-600"
                : storeAvailability.state === "closed"
                  ? "border-amber-200 bg-amber-50 text-amber-900"
                  : "border-red-200 bg-red-50 text-red-800"
            }`}
          >
            <strong className="block">
              {storeAvailability.state === "checking"
                ? "Verificando horário"
                : storeAvailability.state === "closed"
                  ? "Pedidos indisponíveis agora"
                  : "Não foi possível confirmar o horário"}
            </strong>
            <span>{storeAvailability.message}</span>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1fr_390px] lg:items-start">
          <Card>
            <form onSubmit={handleSubmit(submit)} noValidate>
              <input
                type="text"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                className="absolute h-px w-px overflow-hidden opacity-0 pointer-events-none"
                {...register("website")}
              />
              <CardHeader>
                <h2 className="text-lg font-black">Dados para entrega</h2>
              </CardHeader>

              <CardContent className="pt-5">
                <div className="grid gap-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <label className="grid gap-2">
                      <span className="text-sm font-bold">Nome</span>
                      <Input
                        autoComplete="name"
                        aria-invalid={Boolean(errors.customerName)}
                        {...register("customerName")}
                      />
                      <FieldError message={errors.customerName?.message} />
                    </label>

                    <label className="grid gap-2">
                      <span className="text-sm font-bold">Telefone / WhatsApp</span>
                      <Controller
                        control={control}
                        name="phone"
                        render={({ field }) => {
                          const digits = field.value.replace(/\D/g, "");
                          return (
                            <PatternFormat
                              customInput={Input}
                              format={
                                digits.length <= 10
                                  ? "(##) ####-####"
                                  : "(##) #####-####"
                              }
                              inputMode="tel"
                              autoComplete="tel"
                              placeholder="(88) 99874-5423"
                              value={field.value}
                              onValueChange={({ formattedValue }) =>
                                field.onChange(formattedValue)
                              }
                              onBlur={field.onBlur}
                              getInputRef={field.ref}
                              aria-invalid={Boolean(errors.phone)}
                            />
                          );
                        }}
                      />
                      <FieldError message={errors.phone?.message} />
                    </label>
                  </div>

                  <label className="grid gap-2">
                    <span className="text-sm font-bold">Endereço de entrega</span>
                    <Textarea
                      rows={3}
                      placeholder="Rua, número, bairro e ponto de referência"
                      aria-invalid={Boolean(errors.address)}
                      {...register("address")}
                    />
                    <FieldError message={errors.address?.message} />
                  </label>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <label className="grid gap-2">
                      <span className="text-sm font-bold">Forma de pagamento</span>
                      <NativeSelect
                        defaultValue=""
                        aria-invalid={Boolean(errors.paymentMethod)}
                        {...register("paymentMethod")}
                      >
                        <option value="" disabled>
                          Selecionar
                        </option>
                        <option value="pix">Pix</option>
                        <option value="cash">Dinheiro</option>
                        <option value="card_on_delivery">Cartão na entrega</option>
                      </NativeSelect>
                      <FieldError message={errors.paymentMethod?.message} />
                    </label>

                    {paymentMethod === "cash" && (
                      <label className="grid gap-2">
                        <span className="text-sm font-bold">Troco para quanto?</span>
                        <Controller
                          control={control}
                          name="cashChangeFor"
                          render={({ field }) => (
                            <NumericFormat
                              customInput={Input}
                              inputMode="decimal"
                              placeholder="Ex.: 50,00"
                              decimalSeparator=","
                              thousandSeparator="."
                              decimalScale={2}
                              allowNegative={false}
                              prefix="R$ "
                              value={field.value}
                              valueIsNumericString
                              onValueChange={({ value }) => field.onChange(value)}
                              onBlur={field.onBlur}
                              getInputRef={field.ref}
                              aria-invalid={Boolean(errors.cashChangeFor)}
                            />
                          )}
                        />
                        <span className="text-xs text-zinc-500">
                          Deixe em branco se não precisar de troco.
                        </span>
                        <FieldError message={errors.cashChangeFor?.message} />
                      </label>
                    )}
                  </div>

                  <label className="grid gap-2">
                    <span className="text-sm font-bold">Observação</span>
                    <Textarea
                      rows={3}
                      placeholder="Ex.: sem cebola, portão azul..."
                      aria-invalid={Boolean(errors.notes)}
                      {...register("notes")}
                    />
                    <FieldError message={errors.notes?.message} />
                  </label>
                </div>

                {serverError && (
                  <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-800">
                    {serverError}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={
                    !cart.items.length ||
                    isSubmitting ||
                    storeAvailability.state !== "open"
                  }
                  className="mt-7 min-h-14 w-full text-base font-black"
                >
                  {isSubmitting
                    ? "Criando comanda..."
                    : storeAvailability.state === "checking"
                      ? "Verificando horário..."
                      : storeAvailability.state !== "open"
                        ? "Estabelecimento fechado"
                        : "Enviar pedido"}
                </Button>
              </CardContent>
            </form>
          </Card>

          <Card className="h-fit lg:sticky lg:top-6">
            <CardHeader>
              <h2 className="text-lg font-black">Resumo do pedido</h2>
              {cart.items.length > 0 && (
                <p className="mt-1 text-sm text-zinc-500">
                  {cart.itemCount} {cart.itemCount === 1 ? "item" : "itens"} na sacola
                </p>
              )}
            </CardHeader>

            <CardContent className="pt-5">
              {cart.items.length === 0 ? (
                <div>
                  <p className="text-sm text-zinc-500">Sua sacola está vazia.</p>
                  <Link href="/" className="mt-3 inline-block text-sm font-bold text-[var(--brand)]">
                    Voltar ao cardápio
                  </Link>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    {visibleItems.map((item) => (
                      <div
                        key={item.productId}
                        className="flex gap-3 border-b border-zinc-100 pb-4 last:border-0 last:pb-0"
                      >
                        {item.imageUrl ? (
                          <Image
                            src={item.imageUrl}
                            alt=""
                            width={54}
                            height={54}
                            className="h-14 w-14 shrink-0 rounded-xl object-cover"
                          />
                        ) : (
                          <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-zinc-50 text-zinc-400">
                            <ImageOff className="h-4 w-4" />
                            <span className="mt-1 text-xs font-bold">Sem imagem</span>
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-2 text-sm font-bold">
                            {item.quantity}× {item.name}
                          </p>
                          <p className="mt-1 text-sm text-zinc-500">
                            {formatBRL(item.price * item.quantity)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {cart.items.length > 5 && (
                    <Button
                      type="button"
                      variant="ghost"
                      aria-expanded={showAllItems}
                      onClick={() => setShowAllItems((current) => !current)}
                      className="mt-3 w-full text-[var(--brand)] hover:bg-orange-50 hover:text-[var(--brand-dark)]"
                    >
                      {showAllItems ? (
                        <>
                          Ver menos <ChevronUp className="h-4 w-4" />
                        </>
                      ) : (
                        <>
                          Ver mais ({hiddenItemsCount}) <ChevronDown className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  )}

                  <div className="mt-5 flex justify-between border-t border-zinc-200 pt-5 text-lg">
                    <span>Total dos itens</span>
                    <strong>{formatBRL(cart.subtotal)}</strong>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <span className="text-xs font-medium text-red-600">{message}</span>;
}
