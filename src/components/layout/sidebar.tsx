'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { type NavItem } from '@/lib/constants'
import { ChevronLeft, GraduationCap } from 'lucide-react'
import { useState } from 'react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface SidebarProps {
  items: NavItem[]
  className?: string
}

export function Sidebar({ items, className }: SidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          'hidden md:flex flex-col border-r bg-card/80 backdrop-blur-md h-screen sticky top-0 transition-all duration-300',
          collapsed ? 'w-[68px]' : 'w-64',
          className
        )}
      >
        <div className={cn('flex items-center gap-2 px-4 h-16 border-b', collapsed && 'justify-center px-2')}>
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground">
            <GraduationCap className="h-5 w-5" />
          </div>
          {!collapsed && (
            <span className="text-lg font-bold tracking-tight">studEZ</span>
          )}
        </div>

        <ScrollArea className="flex-1 py-2">
          <nav className="space-y-1 px-2">
            {items.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              const link = (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                    collapsed && 'justify-center px-2'
                  )}
                >
                  <item.icon className={cn('h-5 w-5 shrink-0', isActive && 'text-primary')} />
                  {!collapsed && <span>{item.title}</span>}
                </Link>
              )

              if (collapsed) {
                return (
                  <Tooltip key={item.href}>
                    <TooltipTrigger asChild>{link}</TooltipTrigger>
                    <TooltipContent side="right" className="font-medium">
                      {item.title}
                    </TooltipContent>
                  </Tooltip>
                )
              }

              return link
            })}
          </nav>
        </ScrollArea>

        <Separator />
        <div className="p-2">
          <Button
            variant="ghost"
            size="sm"
            className={cn('w-full justify-center', !collapsed && 'justify-start')}
            onClick={() => setCollapsed(!collapsed)}
          >
            <ChevronLeft className={cn('h-4 w-4 transition-transform', collapsed && 'rotate-180')} />
            {!collapsed && <span className="ml-2">Collapse</span>}
          </Button>
        </div>
      </aside>
    </TooltipProvider>
  )
}
