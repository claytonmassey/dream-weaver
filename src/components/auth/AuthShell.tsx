import type { ReactNode } from "react";
import { BrandLogo } from "@/components/brand/BrandLogo";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="auth-shell relative flex min-h-dvh items-center justify-center px-5 py-12">
      <div className="auth-panel relative z-10 w-full max-w-[24rem] overflow-hidden rounded-[1.75rem] px-6 pb-7 pt-8 sm:px-8 sm:pb-8 sm:pt-9">
        <div className="auth-panel-shine pointer-events-none absolute inset-x-0 top-0 h-px" />

        <div className="mb-8 space-y-5 text-center">
          <div className="flex justify-center">
            <BrandLogo linked={false} height={52} className="mx-auto" />
          </div>
          <div className="space-y-2">
            <h1 className="font-display text-[1.85rem] leading-tight tracking-tight text-white sm:text-[2rem]">
              {title}
            </h1>
            {subtitle ? (
              <p className="mx-auto max-w-[18rem] text-[0.95rem] leading-relaxed text-[#d8cfe6]">
                {subtitle}
              </p>
            ) : null}
          </div>
        </div>

        {children}

        {footer ? <div className="mt-7 text-center">{footer}</div> : null}
      </div>
    </div>
  );
}

export function AuthField({
  id,
  label,
  hint,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="auth-label">
        {label}
        {hint ? <span className="auth-muted font-normal"> {hint}</span> : null}
      </label>
      {children}
    </div>
  );
}
