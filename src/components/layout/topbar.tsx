'use client'

import { useRouter } from 'next/navigation'
import {
  Bell,
  LogOut,
  Moon,
  Search,
  Sun,
  User,
  ShieldAlert,
  GraduationCap,
  Briefcase,
  CheckCheck,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useUser } from '@/hooks/use-user'
import { useNotifications } from '@/hooks/use-data'
import { DataService } from '@/lib/data-service'
import { getInitials } from '@/lib/utils'
import { MobileNav } from './mobile-nav'
import { type NavItem } from '@/lib/constants'
import { toast } from 'sonner'
import Link from 'next/link'

interface TopbarProps {
  navItems: NavItem[]
}

export function Topbar({ navItems }: TopbarProps) {
  const { profile, role, logout } = useUser()
  const { notifications, refresh: refreshNotifs } = useNotifications(role)
  const { theme, setTheme } = useTheme()
  const router = useRouter()

  const unreadCount = notifications.filter(
    (n) => !n.read_by || !n.read_by.includes(profile?.id || '')
  ).length

  const handleSignOut = async () => {
    toast.success('Signed out')
    await logout()
  }

  const markAsRead = async (id: string) => {
    if (profile) {
      await DataService.markNotificationRead(id, profile.id)
      refreshNotifs()
    }
  }

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-card/80 backdrop-blur-sm px-4 md:px-6">
      <MobileNav items={navItems} />

      <div className="hidden md:flex md:flex-1">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search courses, exams, assignments..."
            className="pl-9 bg-muted/40 border-muted h-9 text-sm rounded-lg"
          />
        </div>
      </div>

      <div className="flex flex-1 items-center justify-end gap-2">
        {/* Authentic Database Role Indicator (Role is locked to user account) */}
        <div className="flex items-center gap-1.5 px-3 py-1 bg-muted/60 border rounded-full text-xs font-semibold select-none shadow-sm">
          {role === 'admin' ? (
            <ShieldAlert className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
          ) : role === 'teacher' ? (
            <Briefcase className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
          ) : (
            <GraduationCap className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
          )}
          <span className="capitalize">{role === 'teacher' ? 'Faculty / Teacher' : role === 'admin' ? 'Administrator' : 'Student'}</span>
        </div>

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full h-9 w-9"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>

        {/* Notifications Popover */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full relative h-9 w-9">
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
              <span className="sr-only">Notifications</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-0 shadow-lg">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-sm">Notifications</p>
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="text-xs px-1.5 py-0 h-4">
                    {unreadCount} new
                  </Badge>
                )}
              </div>
              {role === 'admin' && (
                <Link href="/admin/notifications" className="text-xs text-primary hover:underline">
                  Manage
                </Link>
              )}
            </div>
            <div className="max-h-72 overflow-y-auto divide-y">
              {notifications.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  No notifications to display
                </div>
              ) : (
                notifications.map((notif) => {
                  const isRead = notif.read_by?.includes(profile?.id || '')
                  return (
                    <div
                      key={notif.id}
                      className={`p-3 text-xs transition-colors hover:bg-muted/50 ${
                        !isRead ? 'bg-primary/5' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-medium text-foreground">{notif.title}</div>
                        {!isRead && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 text-muted-foreground hover:text-foreground"
                            onClick={() => markAsRead(notif.id)}
                            title="Mark as read"
                          >
                            <CheckCheck className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                      <p className="text-muted-foreground mt-0.5 line-clamp-2">{notif.message}</p>
                      <div className="flex items-center justify-between mt-1.5 text-[10px] text-muted-foreground/75">
                        <span>{new Date(notif.created_at).toLocaleDateString()}</span>
                        <span className="capitalize px-1.5 py-0.5 rounded bg-muted text-foreground">
                          {notif.type}
                        </span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full ring-1 ring-border">
              <Avatar className="h-9 w-9">
                <AvatarImage src={profile?.avatar_url || ''} alt={profile?.full_name || ''} />
                <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                  {profile?.full_name ? getInitials(profile.full_name) : 'U'}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{profile?.full_name || 'User'}</p>
                <p className="text-xs leading-none text-muted-foreground">{profile?.email || ''}</p>
                <div className="pt-1">
                  <Badge variant="outline" className="capitalize text-[10px] px-1.5 py-0 h-4">
                    {role}
                  </Badge>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/profile')} className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            {role === 'admin' && (
              <DropdownMenuItem onClick={() => router.push('/admin')} className="cursor-pointer">
                <ShieldAlert className="mr-2 h-4 w-4" />
                Admin Dashboard
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-red-600 dark:text-red-400">
              <LogOut className="mr-2 h-4 w-4" />
              Sign out / Switch Account
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
