import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary/90 text-primary-foreground hover:bg-primary hover:shadow-md hover:shadow-primary/25 backdrop-blur-sm",
        secondary: "border-transparent bg-secondary/80 text-secondary-foreground hover:bg-secondary hover:shadow-sm backdrop-blur-sm",
        destructive: "border-transparent bg-destructive/90 text-destructive-foreground hover:bg-destructive hover:shadow-md hover:shadow-destructive/25",
        outline: "text-foreground border-border/50 bg-background/50 hover:bg-background hover:border-border hover:shadow-sm backdrop-blur-sm",
        success: "border-transparent bg-success/90 text-success-foreground hover:bg-success hover:shadow-md hover:shadow-success/25",
        warning: "border-transparent bg-warning/90 text-warning-foreground hover:bg-warning hover:shadow-md hover:shadow-warning/25",
        info: "border-transparent bg-info/90 text-info-foreground hover:bg-info hover:shadow-md hover:shadow-info/25",
        error: "border-transparent bg-error/90 text-error-foreground hover:bg-error hover:shadow-md hover:shadow-error/25",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
