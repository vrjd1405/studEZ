'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@/hooks/use-user'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { getInitials } from '@/lib/utils'
import { Mail, Phone, Building2, Calendar, Shield, Save, Check } from 'lucide-react'
import { toast } from 'sonner'

export default function ProfilePage() {
  const { profile, loading, updateProfile } = useUser()

  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [department, setDepartment] = useState('')
  const [year, setYear] = useState<number | string>('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '')
      setPhone(profile.phone || '')
      setDepartment(profile.department || '')
      setYear(profile.year || '')
    }
  }, [profile])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await updateProfile({
        full_name: fullName.trim(),
        phone: phone.trim() || null,
        department: department.trim() || null,
        year: year ? parseInt(year.toString(), 10) : null,
      })
      toast.success('Profile updated successfully!')
    } catch {
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl md:col-span-2" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Profile & Settings"
        description="Manage your institutional personal information, contact methods, and academic records"
      />

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Card */}
        <Card className="shadow-sm">
          <CardContent className="flex flex-col items-center pt-6">
            <Avatar className="h-24 w-24 mb-4 ring-2 ring-primary/20">
              <AvatarImage src={profile?.avatar_url || ''} />
              <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">
                {profile?.full_name ? getInitials(profile.full_name) : 'U'}
              </AvatarFallback>
            </Avatar>
            <h2 className="text-xl font-bold text-center">{profile?.full_name || 'User'}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{profile?.email || ''}</p>
            <Badge variant="outline" className="mt-2.5 capitalize text-xs px-2.5 py-0.5">
              <Shield className="mr-1.5 h-3.5 w-3.5 text-primary" />
              Role: {profile?.role || 'student'}
            </Badge>

            <Separator className="my-5" />

            <div className="w-full space-y-3.5 text-sm">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground truncate">{profile?.email || '--'}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">{profile?.phone || '--'}</span>
              </div>
              <div className="flex items-center gap-3">
                <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">{profile?.department || 'Department not assigned'}</span>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">
                  {profile?.year ? `Year ${profile.year} Student` : 'Faculty / Administrator'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Edit Form */}
        <Card className="md:col-span-2 shadow-sm">
          <form onSubmit={handleSave}>
            <CardHeader>
              <CardTitle className="text-lg">Personal Information</CardTitle>
              <CardDescription>Keep your institutional contact details up to date</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="prof-name">Full Name</Label>
                  <Input
                    id="prof-name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="prof-email">Institutional Email</Label>
                  <Input
                    id="prof-email"
                    value={profile?.email || ''}
                    disabled
                    className="bg-muted/50 cursor-not-allowed text-muted-foreground"
                  />
                  <p className="text-[11px] text-muted-foreground">Managed by central campus registry</p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="prof-phone">Contact Phone</Label>
                  <Input
                    id="prof-phone"
                    placeholder="+1 555-0100"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="prof-dept">Academic Department</Label>
                  <Input
                    id="prof-dept"
                    placeholder="e.g. Computer Science"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                  />
                </div>
                {profile?.role === 'student' && (
                  <div className="space-y-1.5">
                    <Label htmlFor="prof-year">Academic Year</Label>
                    <Input
                      id="prof-year"
                      type="number"
                      min="1"
                      max="6"
                      placeholder="e.g. 3"
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                    />
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-end border-t pt-4">
              <Button type="submit" disabled={saving}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? 'Saving...' : 'Save Profile Changes'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
