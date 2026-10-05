import { Card, CardContent } from '@/components/ui/card'
import { type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: string | number
  description?: string
  icon: LucideIcon
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
  className?: string
  iconClassName?: string
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  trendValue,
  className,
  iconClassName,
}: StatCardProps) {
  return (
    <Card className={cn('hover:shadow-md transition-shadow duration-200', className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
            {trend && trendValue && (
              <p className={cn(
                'text-xs font-medium',
                trend === 'up' && 'text-emerald-600 dark:text-emerald-400',
                trend === 'down' && 'text-red-600 dark:text-red-400',
                trend === 'neutral' && 'text-muted-foreground'
              )}>
                {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '•'} {trendValue}
              </p>
            )}
          </div>
          <div className={cn('rounded-xl p-3 bg-primary/10', iconClassName)}>
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
