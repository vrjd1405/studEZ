import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  status: string
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
  className?: string
}

const variantStyles = {
  default: 'bg-secondary text-secondary-foreground',
  success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800',
  danger: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800',
  info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800',
}

export function StatusBadge({ status, variant = 'default', className }: StatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(variantStyles[variant], 'font-medium capitalize', className)}
    >
      {status}
    </Badge>
  )
}
