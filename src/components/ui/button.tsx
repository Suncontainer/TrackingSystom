import type { ComponentPropsWithoutRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils/cn";

const buttonVariants = cva("button-base", {
  variants: {
    variant: {
      primary: "button-primary",
      secondary: "button-secondary",
      ghost: "button-ghost"
    }
  },
  defaultVariants: {
    variant: "primary"
  }
});

type ButtonProps = ComponentPropsWithoutRef<"button"> & VariantProps<typeof buttonVariants>;

export function Button({ className, variant, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant }), className)} {...props} />;
}
