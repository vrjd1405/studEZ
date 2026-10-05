'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { useMaterials, useSubjects } from '@/hooks/use-data'
import { useUser } from '@/hooks/use-user'
import { DataService } from '@/lib/data-service'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  FolderOpen,
  Plus,
  Search,
  FileText,
  Video,
  Link as LinkIcon,
  Presentation,
  Download,
  ExternalLink,
  BookOpen,
} from 'lucide-react'
import { toast } from 'sonner'
import type { Material } from '@/types'

export default function MaterialsPage() {
  const { profile, role } = useUser()
  const { materials, loading, refresh } = useMaterials()
  const { subjects } = useSubjects()

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [selectedSubject, setSelectedSubject] = useState<string>('all')
  const [openUploadDialog, setOpenUploadDialog] = useState(false)

  // Upload Form states
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [type, setType] = useState<Material['type']>('notes')
  const [fileUrl, setFileUrl] = useState('')
  const [saving, setSaving] = useState(false)

  const handleCreateMaterial = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!subjectId || !profile) {
      toast.error('Please select a subject')
      return
    }
    setSaving(true)
    try {
      await DataService.createMaterial({
        title: title.trim(),
        description: description.trim() || null,
        subject_id: subjectId,
        type,
        file_url: fileUrl.trim() || null,
        uploaded_by: profile.id,
      })
      toast.success('Study material uploaded successfully!')
      setOpenUploadDialog(false)
      setTitle('')
      setDescription('')
      setFileUrl('')
      refresh()
    } catch {
      toast.error('Failed to upload material')
    } finally {
      setSaving(false)
    }
  }

  const filteredMaterials = materials.filter((m) => {
    const matchesSearch =
      m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.description && m.description.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesType = selectedType === 'all' || m.type === selectedType
    const matchesSubject = selectedSubject === 'all' || m.subject_id === selectedSubject
    return matchesSearch && matchesType && matchesSubject
  })

  const getTypeIcon = (type: Material['type']) => {
    switch (type) {
      case 'notes':
        return <FileText className="h-5 w-5 text-blue-500" />
      case 'slides':
        return <Presentation className="h-5 w-5 text-amber-500" />
      case 'video':
        return <Video className="h-5 w-5 text-rose-500" />
      case 'link':
        return <LinkIcon className="h-5 w-5 text-emerald-500" />
      default:
        return <BookOpen className="h-5 w-5 text-purple-500" />
    }
  }

  const canManage = role === 'admin' || role === 'teacher'

  return (
    <div className="space-y-6">
      <PageHeader
        title="Learning Resources & Materials"
        description="Access lecture notes, presentation slides, reference documents, and video recordings"
      >
        {canManage && (
          <Dialog open={openUploadDialog} onOpenChange={setOpenUploadDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Upload Material
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px]">
              <form onSubmit={handleCreateMaterial}>
                <DialogHeader>
                  <DialogTitle>Add Courseware Material</DialogTitle>
                  <DialogDescription>
                    Publish notes, presentation decks, or resource links for your students
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="m-title">Title</Label>
                    <Input
                      id="m-title"
                      placeholder="e.g. Chapter 4: Binary Search Trees Notes"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="m-subject">Subject</Label>
                      <Select value={subjectId} onValueChange={setSubjectId} required>
                        <SelectTrigger id="m-subject">
                          <SelectValue placeholder="Select course" />
                        </SelectTrigger>
                        <SelectContent>
                          {subjects.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.code} - {s.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="m-type">Resource Type</Label>
                      <Select value={type} onValueChange={(val) => setType(val as Material['type'])}>
                        <SelectTrigger id="m-type">
                          <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="notes">Notes</SelectItem>
                          <SelectItem value="slides">Slides</SelectItem>
                          <SelectItem value="document">Document</SelectItem>
                          <SelectItem value="video">Video</SelectItem>
                          <SelectItem value="link">Web Link</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="m-url">Resource URL / Cloud Storage Link</Label>
                    <Input
                      id="m-url"
                      placeholder="https://... (PDF link, Slides, YouTube, or Drive)"
                      value={fileUrl}
                      onChange={(e) => setFileUrl(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="m-desc">Description / Synopsis</Label>
                    <Input
                      id="m-desc"
                      placeholder="Short notes on what this document covers..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpenUploadDialog(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? 'Publishing...' : 'Publish Material'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </PageHeader>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notes, slides, documents..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-32 h-9 text-xs">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="notes">Notes</SelectItem>
              <SelectItem value="slides">Slides</SelectItem>
              <SelectItem value="document">Document</SelectItem>
              <SelectItem value="video">Video</SelectItem>
              <SelectItem value="link">Links</SelectItem>
            </SelectContent>
          </Select>

          {subjects.length > 0 && (
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger className="w-40 h-9 text-xs">
                <SelectValue placeholder="All Subjects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {subjects.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      ) : filteredMaterials.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="No study materials found"
          description={
            searchTerm || selectedType !== 'all' || selectedSubject !== 'all'
              ? 'No courseware matched the selected filters. Try broadening your criteria.'
              : 'Course materials uploaded by instructors will be displayed here for instant access.'
          }
        >
          {canManage && (
            <Button onClick={() => setOpenUploadDialog(true)} className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              Upload First Material
            </Button>
          )}
        </EmptyState>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredMaterials.map((m) => (
            <Card key={m.id} className="flex flex-col justify-between hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="outline" className="font-mono text-xs">
                    {m.subject?.code || 'Course Material'}
                  </Badge>
                  <Badge variant="secondary" className="capitalize text-xs">
                    {m.type}
                  </Badge>
                </div>
                <div className="flex items-start gap-3 mt-2">
                  <div className="p-2 rounded-lg bg-muted/60 shrink-0 mt-0.5">
                    {getTypeIcon(m.type)}
                  </div>
                  <div>
                    <CardTitle className="text-base line-clamp-1">{m.title}</CardTitle>
                    <CardDescription className="line-clamp-2 mt-1">
                      {m.description || 'Verified course study material published by instructor.'}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="text-xs text-muted-foreground pt-0">
                <div className="flex items-center justify-between border-t pt-2.5">
                  <span>Subject: {m.subject?.name || 'Curriculum'}</span>
                  <span>{new Date(m.created_at).toLocaleDateString()}</span>
                </div>
              </CardContent>

              <CardFooter className="border-t pt-3">
                {m.file_url ? (
                  <Button size="sm" variant="outline" className="w-full gap-2 text-xs" asChild>
                    <a href={m.file_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3.5 w-3.5" />
                      Open Resource
                    </a>
                  </Button>
                ) : (
                  <Button size="sm" variant="ghost" className="w-full text-xs text-muted-foreground" disabled>
                    No URL Attached
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
