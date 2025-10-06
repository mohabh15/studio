import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // Estilos base mejorados para tema oscuro elegante
          "flex h-10 w-full rounded-lg",
          // Fondo elegante con transparencia sutil
          "bg-input/50 backdrop-blur-sm",
          // Bordes sutiles mejorados
          "border border-input",
          // Estados hover y focus mejorados
          "hover:border-border hover:bg-background/80",
          "focus-visible:border-ring focus-visible:bg-background",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          // Texto y placeholder mejorados para tema oscuro
          "text-foreground placeholder:text-muted-foreground/70",
          // Estados disabled mejorados
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted/30",
          // Transiciones suaves
          "transition-all duration-300 ease-in-out",
          // Espaciado interno optimizado
          "px-3 py-2 text-base md:text-sm",
          // Estilos para elementos file
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
