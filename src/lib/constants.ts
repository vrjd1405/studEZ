import {
  LayoutDashboard,
  BookOpen,
  CalendarCheck,
  FileText,
  FolderOpen,
  GraduationCap,
  Award,
  Video,
  Bell,
  CalendarDays,
  Bot,
  User,
  Users,
  UserCog,
  Settings,
  type LucideIcon,
} from 'lucide-react'
import { UserRole } from '@/types'

export interface NavItem {
  title: string
  href: string
  icon: LucideIcon
  roles: UserRole[]
}

export const studentNavItems: NavItem[] = [
  { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['student', 'teacher'] },
  { title: 'My Students', href: '/students', icon: Users, roles: ['teacher'] },
  { title: 'Subjects', href: '/subjects', icon: BookOpen, roles: ['student', 'teacher'] },
  { title: 'Attendance', href: '/attendance', icon: CalendarCheck, roles: ['student', 'teacher'] },
  { title: 'Assignments', href: '/assignments', icon: FileText, roles: ['student', 'teacher'] },
  { title: 'Materials', href: '/materials', icon: FolderOpen, roles: ['student', 'teacher'] },
  { title: 'Exams', href: '/exams', icon: GraduationCap, roles: ['student', 'teacher'] },
  { title: 'Grades', href: '/grades', icon: Award, roles: ['student', 'teacher'] },
  { title: 'Meetings', href: '/meetings', icon: Video, roles: ['student', 'teacher'] },
  { title: 'Study Planner', href: '/planner', icon: CalendarDays, roles: ['student'] },
  { title: 'AI Assistant', href: '/ai', icon: Bot, roles: ['student', 'teacher'] },
  { title: 'Profile', href: '/profile', icon: User, roles: ['student', 'teacher'] },
]

export const adminNavItems: NavItem[] = [
  { title: 'Dashboard', href: '/admin', icon: LayoutDashboard, roles: ['admin'] },
  { title: 'User Registry', href: '/admin/users', icon: Users, roles: ['admin'] },
  { title: 'Students', href: '/admin/students', icon: Users, roles: ['admin'] },
  { title: 'Teachers', href: '/admin/teachers', icon: UserCog, roles: ['admin'] },
  { title: 'Subjects', href: '/admin/subjects', icon: BookOpen, roles: ['admin'] },
  { title: 'Attendance', href: '/admin/attendance', icon: CalendarCheck, roles: ['admin'] },
  { title: 'Assignments', href: '/admin/assignments', icon: FileText, roles: ['admin'] },
  { title: 'Materials', href: '/admin/materials', icon: FolderOpen, roles: ['admin'] },
  { title: 'Exams', href: '/admin/exams', icon: GraduationCap, roles: ['admin'] },
  { title: 'Grades', href: '/admin/grades', icon: Award, roles: ['admin'] },
  { title: 'Meetings', href: '/admin/meetings', icon: Video, roles: ['admin'] },
  { title: 'Notifications', href: '/admin/notifications', icon: Bell, roles: ['admin'] },
  { title: 'Settings', href: '/admin/settings', icon: Settings, roles: ['admin'] },
]

export const attendanceStatusColors = {
  present: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  absent: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  late: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
} as const

export const materialTypeIcons = {
  notes: '📝',
  slides: '📊',
  video: '🎬',
  link: '🔗',
  document: '📄',
} as const

export const examTypeColors = {
  midterm: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  final: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  quiz: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  practical: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
} as const

export const gradeColors: Record<string, string> = {
  'A+': 'text-emerald-600 dark:text-emerald-400',
  'A': 'text-emerald-600 dark:text-emerald-400',
  'A-': 'text-emerald-500 dark:text-emerald-400',
  'B+': 'text-blue-600 dark:text-blue-400',
  'B': 'text-blue-600 dark:text-blue-400',
  'B-': 'text-blue-500 dark:text-blue-400',
  'C+': 'text-amber-600 dark:text-amber-400',
  'C': 'text-amber-600 dark:text-amber-400',
  'C-': 'text-amber-500 dark:text-amber-400',
  'D': 'text-orange-600 dark:text-orange-400',
  'F': 'text-red-600 dark:text-red-400',
}
