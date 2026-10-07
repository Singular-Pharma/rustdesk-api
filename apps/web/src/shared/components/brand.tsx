import { cn } from "@workspace/ui/lib/utils"

const logoAlt = "Singular Pharma"

export function BrandLogo({
  onBrand = false,
  className,
}: {
  onBrand?: boolean
  className?: string
}) {
  if (onBrand)
    return (
      <img
        src="/brand/singular-pharma-white.svg"
        alt={logoAlt}
        className={cn("h-8 w-auto", className)}
      />
    )
  return (
    <>
      <img
        src="/brand/singular-pharma-blue.svg"
        alt={logoAlt}
        className={cn("h-8 w-auto dark:hidden", className)}
      />
      <img
        src="/brand/singular-pharma-white.svg"
        alt={logoAlt}
        className={cn("hidden h-8 w-auto dark:block", className)}
      />
    </>
  )
}

export function BrandLeaf({ className }: { className?: string }) {
  return (
    <img
      src="/brand/singular-mark-white.svg"
      alt=""
      aria-hidden
      className={cn("h-8 w-auto", className)}
    />
  )
}

export function ProductName({ className }: { className?: string }) {
  return (
    <span className={cn("text-sm font-semibold tracking-tight", className)}>
      Acesso remoto
    </span>
  )
}
