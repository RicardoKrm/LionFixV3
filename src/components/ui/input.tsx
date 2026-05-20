
import * as React from "react"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

export interface InputProps extends React.ComponentProps<"input"> {
  startIcon?: LucideIcon
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, startIcon: StartIcon, ...props }, ref) => {
    return (
      <div className="relative w-full">
        {StartIcon && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <StartIcon className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
        <input
          type={type}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            StartIcon ? "pl-10" : "px-3",
            className
          )}
          ref={ref}
          {...props}
        />
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
