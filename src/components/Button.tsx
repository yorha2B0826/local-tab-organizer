import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger";
  children: ReactNode;
}

export function Button({ variant = "secondary", className = "", children, ...props }: ButtonProps) {
  return <button className={`btn btn-${variant} ${className}`.trim()} {...props}>{children}</button>;
}
