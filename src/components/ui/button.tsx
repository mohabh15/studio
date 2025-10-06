import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all duration-300 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25 active:scale-95 border border-primary/20 hover:border-primary/40",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:shadow-lg hover:shadow-destructive/25 active:scale-95 border border-destructive/20 hover:border-destructive/40",
        outline: "border border-input bg-background/50 backdrop-blur-sm hover:bg-accent hover:text-accent-foreground hover:shadow-md hover:border-accent/50 active:scale-95",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:shadow-md active:scale-95 border border-secondary/20 hover:border-secondary/40",
        ghost: "hover:bg-accent/10 hover:text-accent-foreground hover:shadow-sm hover:border-accent/30 border border-transparent hover:border-accent/20",
        link: "text-primary underline-offset-4 hover:underline hover:text-primary/80 transition-all duration-200",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
