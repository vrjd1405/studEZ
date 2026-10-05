'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  GraduationCap,
  Loader2,
  ShieldCheck,
  UserCheck,
  CheckCircle2,
  Building2,
  BookOpen,
  Sparkles,
  ArrowRight,
  Mail,
  Lock,
  UserPlus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { signInWithPopup } from 'firebase/auth'
import { auth, googleProvider, isFirebaseConfigured } from '@/lib/firebase/config'
import type { UserRole } from '@/types'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [emailLoading, setEmailLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [roleLoading, setRoleLoading] = useState<string | null>(null)

  // 1. Central Email + Password Login
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      toast.error('Please enter both your email and password.')
      return
    }

    setEmailLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()
      if (res.ok && data.success) {
        toast.success(`Welcome back, ${data.user.full_name}!`)
        if (typeof window !== 'undefined') {
          localStorage.setItem('studez_active_role', data.user.role)
          window.dispatchEvent(new Event('studez_role_switched'))
          window.dispatchEvent(new Event('studez_data_changed'))
        }

        // Automatic redirection based on database role
        if (data.user.role === 'admin') {
          router.push('/admin')
        } else {
          router.push('/dashboard')
        }
        router.refresh()
      } else {
        toast.error(data.error || 'Authentication failed. Please check your credentials.')
      }
    } catch {
      toast.error('Unable to connect to authentication server. Please try again.')
    } finally {
      setEmailLoading(false)
    }
  }

  // 2. Google Sign-In with Firebase
  const handleGoogleSignIn = async () => {
    if (!isFirebaseConfigured() || !auth || !googleProvider) {
      toast.error('Firebase is not configured yet!', {
        description: 'Please verify your Firebase keys in .env.local',
      })
      return
    }

    setGoogleLoading(true)
    try {
      const result = await signInWithPopup(auth, googleProvider)
      const user = result.user

      const res = await fetch('/api/auth/firebase-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          fullName: user.displayName,
          photoUrl: user.photoURL,
          uid: user.uid,
        }),
      })

      const data = await res.json()
      if (res.ok && data.success) {
        toast.success(`Welcome to studEZ, ${data.user.full_name}!`)
        if (typeof window !== 'undefined') {
          localStorage.setItem('studez_active_role', data.user.role)
          window.dispatchEvent(new Event('studez_role_switched'))
          window.dispatchEvent(new Event('studez_data_changed'))
        }

        if (data.user.role === 'admin') {
          router.push('/admin')
        } else {
          router.push('/dashboard')
        }
        router.refresh()
      } else {
        toast.error(data.error || 'Failed to authenticate with studEZ server')
      }
    } catch (err: any) {
      console.error('Google Sign-In Error:', err)
      if (err.code === 'auth/popup-closed-by-user') {
        toast.info('Google sign-in was cancelled')
      } else if (err.code === 'auth/unauthorized-domain') {
        toast.error('Domain not authorized in Firebase Console', {
          description: 'Make sure localhost is added to Authorized Domains in Firebase Console > Authentication > Settings.',
          duration: 7000,
        })
      } else {
        toast.error(err.message || 'Failed to sign in with Google')
      }
    } finally {
      setGoogleLoading(false)
    }
  }

  // 3. Quick-fill Seed Credentials for Testing
  const handleFillCredentials = (fillEmail: string, fillPass: string) => {
    setEmail(fillEmail)
    setPassword(fillPass)
  }

  const quickRoles = [
    {
      role: 'student' as UserRole,
      name: 'Alex Johnson',
      email: 'student@campus.edu',
      desc: '1st Year CSE • Sec A',
      icon: GraduationCap,
      color: 'hover:border-emerald-500/50 hover:bg-emerald-500/5 text-emerald-700 dark:text-emerald-400',
    },
    {
      role: 'teacher' as UserRole,
      name: 'Faculty Instructor (Dr. Senthil)',
      email: 'teacher@campus.edu',
      desc: 'Faculty • Assigned Classes & Marks',
      icon: UserCheck,
      color: 'hover:border-blue-500/50 hover:bg-blue-500/5 text-blue-700 dark:text-blue-400',
    },
    {
      role: 'admin' as UserRole,
      name: 'Campus Dean Office',
      email: 'admin@campus.edu',
      desc: 'System Administrator',
      icon: ShieldCheck,
      color: 'hover:border-purple-500/50 hover:bg-purple-500/5 text-purple-700 dark:text-purple-400',
    },
  ]

  return (
    <div className="w-full max-w-lg px-4 py-8">
      {/* Educational Header */}
      <div className="flex flex-col items-center mb-6 text-center">
        <div className="relative mb-3">
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-primary-foreground shadow-xl ring-8 ring-primary/10">
            <GraduationCap className="h-9 w-9" />
          </div>
          <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-1 shadow">
            <CheckCircle2 className="h-3.5 w-3.5" />
          </div>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">studEZ</h1>
        <p className="text-sm font-medium text-muted-foreground mt-1 max-w-sm">
          Unified Multi-Role Campus Management Platform
        </p>
        <div className="flex items-center gap-2 mt-2">
          <Badge variant="secondary" className="text-[11px] gap-1 px-2.5 py-0.5">
            <Building2 className="h-3 w-3 text-primary" />
            Central Database Authorization
          </Badge>
        </div>
      </div>

      <Card className="shadow-2xl border-border/70 backdrop-blur-md">
        <CardHeader className="text-center pb-3 pt-6">
          <CardTitle className="text-xl font-bold flex items-center justify-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span>Sign In to Your Account</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Enter your campus email & password or sign in with Google.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Email / Password Form */}
          <form onSubmit={handleEmailLogin} className="space-y-3.5">
            <div className="space-y-1.5 text-left">
              <Label htmlFor="email" className="text-xs font-semibold">Campus Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="e.g. student@campus.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9 h-10 text-sm"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5 text-left">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-semibold">Password</Label>
                <span className="text-[11px] text-muted-foreground">Default: password123</span>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 h-10 text-sm"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={emailLoading || googleLoading}
              className="w-full h-10 text-sm font-semibold shadow gap-2 mt-1"
            >
              {emailLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              <span>Sign In to Dashboard</span>
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/80" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
              <span className="bg-card px-2">Or continue with</span>
            </div>
          </div>

          {/* Google Authentication */}
          <Button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading || emailLoading}
            variant="outline"
            className="w-full h-10 text-xs font-bold gap-3 shadow-xs border-border/80 transition-all hover:bg-muted"
          >
            {googleLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            ) : (
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
              </svg>
            )}
            <span>Sign in with Google</span>
          </Button>

          {/* Quick Credential Fillers for Testing */}
          <div className="pt-2">
            <div className="text-[11px] font-semibold text-muted-foreground mb-1.5 flex items-center justify-between">
              <span>Quick Seed Credentials:</span>
              <span className="text-[10px] text-primary">Click to prefill</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {quickRoles.map((item) => (
                <button
                  key={item.role}
                  type="button"
                  onClick={() => handleFillCredentials(item.email, 'password123')}
                  className="p-2 text-left rounded-lg border border-border/70 hover:border-primary/50 transition-all bg-muted/40 hover:bg-muted text-xs group"
                >
                  <div className="font-semibold text-[11px] truncate">{item.name.split(' ')[0]}</div>
                  <div className="text-[9px] text-muted-foreground capitalize">{item.role}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Registration Link */}
          <div className="pt-2 text-center border-t border-border/60">
            <p className="text-xs text-muted-foreground">
              Don&apos;t have an account yet?{' '}
              <Link
                href="/register"
                className="font-semibold text-primary hover:underline inline-flex items-center gap-1"
              >
                <UserPlus className="h-3.5 w-3.5" />
                Register as Student or Teacher
              </Link>
            </p>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col border-t pt-3 pb-3 text-center bg-muted/20">
          <div className="flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
            <BookOpen className="h-3 w-3 text-primary" />
            <span>Central Relational Database • SQLite ACID • Role-Enforced</span>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
