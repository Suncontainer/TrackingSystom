import Image from "next/image";

type LogoVariant = "horizontal-dark" | "horizontal-light" | "stacked-dark" | "stacked-light";

const logoSource = {
  "horizontal-dark": "/brand/logo-horizontal-dark.png",
  "horizontal-light": "/brand/logo-horizontal-light.png",
  "stacked-dark": "/brand/logo-stacked-dark.png",
  "stacked-light": "/brand/logo-stacked-light.png"
} satisfies Record<LogoVariant, string>;

const logoSize = {
  "horizontal-dark": { width: 2048, height: 415 },
  "horizontal-light": { width: 2048, height: 604 },
  "stacked-dark": { width: 2048, height: 1020 },
  "stacked-light": { width: 2048, height: 1020 }
} satisfies Record<LogoVariant, { width: number; height: number }>;

type SunContainerLogoProps = {
  variant?: LogoVariant;
  priority?: boolean;
  className?: string;
  decorative?: boolean;
};

export function SunContainerLogo({
  variant = "horizontal-dark",
  priority = false,
  className,
  decorative = false
}: SunContainerLogoProps) {
  const size = logoSize[variant];

  return (
    <Image
      src={logoSource[variant]}
      alt={decorative ? "" : "Sun Container"}
      width={size.width}
      height={size.height}
      priority={priority}
      className={className}
      sizes="(max-width: 768px) 180px, 240px"
    />
  );
}
