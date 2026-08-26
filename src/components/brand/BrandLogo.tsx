import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";

/** Compact mark for avatars, nav chips, etc. */
export function BrandIcon({
  className,
  size = 28,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <Image
      src="/brand/icon.png"
      alt=""
      width={size}
      height={size}
      className={cn("object-contain", className)}
      priority
    />
  );
}

/** Full logo artwork (includes wordmark in the image). */
export function BrandLogo({
  href = "/",
  linked = true,
  className,
  height = 48,
}: {
  href?: string;
  linked?: boolean;
  className?: string;
  height?: number;
}) {
  const content = (
    <Image
      src="/brand/logo.png"
      alt="dreamweava"
      width={Math.round(height * 3.2)}
      height={height}
      className={cn("h-auto w-auto object-contain", className)}
      style={{ height }}
      priority
    />
  );

  if (!linked) return content;
  return (
    <Link href={href} className="inline-flex" aria-label="dreamweava home">
      {content}
    </Link>
  );
}

/** @deprecated Use BrandIcon */
export const BrandMark = BrandIcon;
