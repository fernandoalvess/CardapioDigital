import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "default" | "outline" | "ghost";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

const variants: Record<ButtonVariant, string> = {
  default:
    "bg-[#ff6500] text-white hover:bg-[#df5700] shadow-sm disabled:bg-zinc-300",
  outline:
    "border border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-50 disabled:text-zinc-400",
  ghost: "bg-transparent text-zinc-700 hover:bg-zinc-100",
};

export function Button({
  className = "",
  variant = "default",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-100 disabled:cursor-not-allowed disabled:opacity-70 ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
