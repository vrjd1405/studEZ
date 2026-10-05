'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { isLiveSupabaseConfigured } from '@/lib/data-service'
import { Settings, Save, Database, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

export default function AdminSettingsPage() {
  const [academicTerm, setAcademicTerm] = useState('Fall 2026')
  const [attendanceThreshold, setAttendanceThreshold] = useState('75')
  const [gradingScale, setGradingScale] = useState('4.0')
  const [emailAlerts, setEmailAlerts] = useState(true)
  const [allowStudentSubmissions, setAllowStudentSubmissions] = useState(true)
  const [saving, setSaving] = useState(false)

  const isSupabaseLive = isLiveSupabaseConfigured()

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setTimeout(() => {
      setSaving(false)
      toast.success('Campus institutional parameters updated!')
    }, 400)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Institutional System Settings"
        description="Configure academic calendar terms, attendance eligibility thresholds, and infrastructure connection status"
      />

      <div className="grid gap-6 md:grid-cols-2">
        {/* Academic Policies */}
        <Card className="shadow-sm">
          <form onSubmit={handleSaveSettings}>
            <CardHeader>
              <CardTitle className="text-lg">Academic Policies & Configuration</CardTitle>
              <CardDescription>Rules applied to GPA calculations and attendance checks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="set-term">Current Academic Term</Label>
                <Input
                  id="set-term"
                  value={academicTerm}
                  onChange={(e) => setAcademicTerm(e.target.value)}
                  placeholder="e.g. Fall 2026"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="set-att">Min. Attendance Threshold (%)</Label>
                  <Input
                    id="set-att"
                    type="number"
                    min="50"
                    max="100"
                    value={attendanceThreshold}
                    onChange={(e) => setAttendanceThreshold(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="set-gpa">GPA Grading Scale</Label>
                  <Select value={gradingScale} onValueChange={setGradingScale}>
                    <SelectTrigger id="set-gpa">
                      <SelectValue placeholder="Scale" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="4.0">Standard 4.0 Scale</SelectItem>
                      <SelectItem value="10.0">10.0 Scale (CGPA)</SelectItem>
                      <SelectItem value="percentage">Percentage (100%)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Automatic Attendance Warning</Label>
                    <p className="text-xs text-muted-foreground">Alert students when attendance falls below threshold</p>
                  </div>
                  <Switch checked={emailAlerts} onCheckedChange={setEmailAlerts} />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Open Assignment Submissions</Label>
                    <p className="text-xs text-muted-foreground">Allow students to upload project deliverables</p>
                  </div>
                  <Switch checked={allowStudentSubmissions} onCheckedChange={setAllowStudentSubmissions} />
                </div>
              </div>
            </CardContent>

            <CardFooter className="border-t pt-4 flex justify-end">
              <Button type="submit" disabled={saving}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? 'Saving...' : 'Save Configuration'}
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* Database & Infrastructure */}
        <div className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                Database Engine Status
              </CardTitle>
              <CardDescription>Backend persistence and synchronization health</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-xl border bg-muted/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Supabase Cloud Connection</span>
                  {isSupabaseLive ? (
                    <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 gap-1 text-xs">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Live Connected
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-blue-700 dark:text-blue-400 gap-1 text-xs">
                      <ShieldCheck className="h-3.5 w-3.5" /> Client Storage Active
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {isSupabaseLive
                    ? 'Connected to live Supabase cluster with Row Level Security (RLS) policies enforced.'
                    : 'Running in resilient client persistence mode. Add your live Supabase project URL and key to .env.local to activate instant cloud synchronization.'}
                </p>
              </div>

              <div className="text-xs text-muted-foreground space-y-2">
                <div className="flex items-center justify-between border-b pb-2">
                  <span>Database Schema</span>
                  <span className="font-mono text-foreground">schema.sql (11 tables)</span>
                </div>
                <div className="flex items-center justify-between border-b pb-2">
                  <span>AI Inference Provider</span>
                  <span className="font-mono text-foreground">Groq API (Prepared)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>App Version</span>
                  <span className="font-mono text-foreground">studEZ v1.0.0 CampusOS</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
