import { HTMLAttributes } from "react"
import { cn } from "@/lib/utils"

interface ProgressProps extends HTMLAttributes<HTMLDivElement> {
  value?: number
}

export function Progress({ className, value = 0, ...props }: ProgressProps) {
  return (
    <div
      className={cn("relative h-1.5 w-full overflow-hidden rounded-full bg-muted", className)}
      {...props}
    >
      <div
        className="h-full rounded-full bg-primary transition-all"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  )
}
