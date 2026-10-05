'use client'

import { useEffect, useState, useCallback } from 'react'
import type { Profile, UserRole } from '@/types'

export function useUser() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const loadUserProfile = useCallback(async () => {
    try {
      // Load session from server SQLite API
      const sessionRes = await fetch('/api/auth/session')
      if (sessionRes.ok) {
        const sessionData = await sessionRes.json()
        if (sessionData.authenticated && sessionData.user) {
          setProfile(sessionData.user)
          setLoading(false)
          return
        }
      }
      setProfile(null)
    } catch (error) {
      console.error('Error fetching user session:', error)
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadUserProfile()

    const handleDataChange = () => {
      loadUserProfile()
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('studez_data_changed', handleDataChange)
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('studez_data_changed', handleDataChange)
      }
    }
  }, [loadUserProfile])

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch {}
    setProfile(null)
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
  }

  // To switch roles, users must log out and sign in with the required account credentials
  const switchRole = async (): Promise<boolean> => {
    await logout()
    return true
  }

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!profile) return null
    try {
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: profile.id,
          ...updates,
        }),
      })
      if (res.ok) {
        await loadUserProfile()
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('studez_data_changed'))
        }
        return profile
      }
    } catch (err) {
      console.error('Failed to update user profile in DB:', err)
    }
    return null
  }

  return {
    user: profile,
    profile,
    loading,
    role: (profile?.role || 'student') as UserRole,
    logout,
    switchRole,
    updateProfile,
    refetchUser: loadUserProfile,
  }
}
