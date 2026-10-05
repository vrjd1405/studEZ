'use client'

import { useState, useEffect, useRef } from 'react'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Bot,
  Send,
  Sparkles,
  BookOpen,
  Brain,
  Lightbulb,
  User,
  Cpu,
  CalendarCheck2,
  FileText,
  Upload,
  CheckCircle,
  AlertCircle,
  Loader2,
  Paperclip,
  Clock,
  PlusCircle,
} from 'lucide-react'
import { useUser } from '@/hooks/use-user'
import { toast } from 'sonner'
import Link from 'next/link'
import { formatDateTime } from '@/lib/utils'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface ChatMessage {
  id: string
  sender: 'ai' | 'user'
  text: string
  time: string
  createdTask?: {
    id: string
    title: string
    subject_name?: string
    due_date?: string
    priority: string
  }
}

export default function AIPage() {
  const { profile } = useUser()
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [aiProvider, setAiProvider] = useState('Google Gemma 4 Open Engine')
  const [selectedModel, setSelectedModel] = useState('gemma-4-31b')
  const [uploadOpen, setUploadOpen] = useState(false)
  const [docTitle, setDocTitle] = useState('')
  const [docContent, setDocContent] = useState('')
  const [docSubject, setDocSubject] = useState('subj-1')
  const [uploading, setUploading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: `Hello ${profile?.full_name?.split(' ')[0] || 'there'}! I am your studEZ Open-Source AI Study Assistant powered by Google Gemma 4 & DigitalOcean Open-Source AI.\n\nI have authorized access to your enrolled courses, upcoming exams, syllabus milestones, and uploaded study materials.\n\nYou can ask me to:\n• Explain complex concepts or lecture slides\n• Summarize your uploaded notes and PDF materials\n• Generate revision practice questions\n• Schedule study tasks directly to your planner (e.g. *"Create a study task for Data Structures tomorrow at 7 PM"*)`,
      time: 'Just now',
    },
  ])

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Quick prompt suggestions
  const promptSuggestions = [
    {
      icon: CalendarCheck2,
      title: 'Schedule Revision Task',
      desc: 'Let AI validate and save to your study planner',
      prompt: 'Create a study task for Data Structures AVL Trees tomorrow at 7 PM',
      color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    },
    {
      icon: FileText,
      title: 'Analyze Uploaded Notes',
      desc: 'Ask questions about your uploaded AVL trees guide',
      prompt: 'Explain AVL tree balance factors and rotations using my uploaded study notes.',
      color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    },
    {
      icon: Brain,
      title: 'Generate Practice Quiz',
      desc: 'Test your understanding with conceptual questions',
      prompt: 'Generate a 3-question revision quiz on Database Normalization (1NF, 2NF, 3NF).',
      color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    },
    {
      icon: Lightbulb,
      title: 'Exam Preparation Strategy',
      desc: 'Break down upcoming midterms into a plan',
      prompt: 'How should I structure my study plan for the upcoming midterm examinations?',
      color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    },
  ]

  const handleSelectPrompt = (promptText: string) => {
    setMessage(promptText)
  }

  // Send message to AI endpoint
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || loading) return

    const userText = message.trim()
    const userMsgId = `msg-${Date.now()}`
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

    const newMessages: ChatMessage[] = [
      ...messages,
      {
        id: userMsgId,
        sender: 'user',
        text: userText,
        time: timeNow,
      },
    ]

    setMessages(newMessages)
    setMessage('')
    setLoading(true)

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          conversationId,
          model: selectedModel,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        if (data.conversationId) setConversationId(data.conversationId)
        if (data.provider) setAiProvider(data.provider)

        const aiMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: data.reply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          createdTask: data.createdTask,
        }

        setMessages((prev) => [...prev, aiMsg])

        if (data.createdTask) {
          toast.success(`Study task created: "${data.createdTask.title}"`)
          window.dispatchEvent(new Event('studez_data_changed'))
        }
      } else {
        toast.error(data.error || 'AI Assistant encountered an error')
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            sender: 'ai',
            text: 'I encountered an unexpected issue processing your request. Please check that you are signed in and try again.',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ])
      }
    } catch {
      toast.error('Network error communicating with AI server')
    } finally {
      setLoading(false)
    }
  }

  // Handle uploading study material for Grounded Q&A
  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!docTitle || !docContent) {
      toast.error('Please enter title and document content')
      return
    }

    setUploading(true)
    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: docTitle,
          file_name: `${docTitle.toLowerCase().replace(/\s+/g, '_')}.txt`,
          file_type: 'text/plain',
          content: docContent,
          subject_id: docSubject,
          is_private: true,
        }),
      })

      if (res.ok) {
        toast.success(`Study material "${docTitle}" uploaded and indexed for AI Q&A!`)
        setUploadOpen(false)
        setDocTitle('')
        setDocContent('')

        // Notify user in chat
        setMessages((prev) => [
          ...prev,
          {
            id: `doc-notif-${Date.now()}`,
            sender: 'ai',
            text: `I have indexed your newly uploaded document: **"${docTitle}"**. You can now ask questions such as *"Summarize this document"* or *"Create revision questions from my notes"*.`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ])
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to save document')
      }
    } catch {
      toast.error('Failed to upload document')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Study Assistant"
        description="Open-Source AI Agent powered by Google Gemma 2 & DigitalOcean GenAI with syllabus RAG"
      >
        <div className="flex flex-wrap items-center gap-2">
          {/* Open-Source Model Selector */}
          <div className="w-56">
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger className="h-8 text-xs font-semibold bg-background">
                <SelectValue placeholder="Select Open-Source Model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gemma-4-31b" className="text-xs">
                  ✨ Gemma 4 31B (Google DeepMind)
                </SelectItem>
                <SelectItem value="gemma-4-26b" className="text-xs">
                  ✨ Gemma 4 26B MoE (Google)
                </SelectItem>
                <SelectItem value="gemma-2-9b" className="text-xs">
                  ✨ Gemma 2 9B (Google)
                </SelectItem>
                <SelectItem value="digitalocean-genai" className="text-xs">
                  🌊 DigitalOcean AI Agent
                </SelectItem>
                <SelectItem value="llama-3.3-70b" className="text-xs">
                  🦙 Llama 3.3 70B (Open-Weight)
                </SelectItem>
                <SelectItem value="mixtral-8x7b" className="text-xs">
                  ⚡ Mixtral 8x7B (Mistral)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Upload Material Dialog Button */}
          <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs font-semibold">
                <Upload className="h-3.5 w-3.5 text-primary" />
                Upload Material
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <form onSubmit={handleUploadDocument}>
                <DialogHeader>
                  <DialogTitle className="text-base font-bold flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Upload Study Notes / Document
                  </DialogTitle>
                  <DialogDescription className="text-xs">
                    Store educational notes, summaries, or syllabus chapters securely for AI grounded Q&A.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-3 py-4 text-xs">
                  <div className="space-y-1">
                    <Label htmlFor="doc-title" className="text-xs">Document Title</Label>
                    <Input
                      id="doc-title"
                      placeholder="e.g. Chapter 4: Relational Normalization"
                      value={docTitle}
                      onChange={(e) => setDocTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="doc-content" className="text-xs">Document Text Content</Label>
                    <Textarea
                      id="doc-content"
                      placeholder="Paste your lecture notes, textbook summary, or educational text here..."
                      className="min-h-36 text-xs leading-relaxed"
                      value={docContent}
                      onChange={(e) => setDocContent(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" size="sm" onClick={() => setUploadOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" disabled={uploading}>
                    {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save & Index Material
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Badge variant="outline" className="gap-1.5 py-1 px-2.5 text-xs font-semibold hidden sm:inline-flex">
            <Cpu className="h-3.5 w-3.5 text-purple-600" />
            <span>{aiProvider}</span>
          </Badge>
        </div>
      </PageHeader>

      {/* Suggested Prompt Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {promptSuggestions.map((item, i) => (
          <Card
            key={i}
            className="cursor-pointer hover:border-primary/50 hover:shadow-md transition-all group border-border/70"
            onClick={() => handleSelectPrompt(item.prompt)}
          >
            <CardContent className="p-3.5 flex items-start gap-3">
              <div className={`p-2 rounded-xl shrink-0 ${item.color}`}>
                <item.icon className="h-4 w-4" />
              </div>
              <div>
                <h4 className="font-semibold text-xs group-hover:text-primary transition-colors leading-snug">
                  {item.title}
                </h4>
                <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chat Thread Interface */}
      <Card className="flex flex-col shadow-sm border border-border/80 h-[580px]">
        <CardHeader className="border-b py-3 px-4 flex flex-row items-center justify-between bg-card/60">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold">studEZ Academic Copilot</CardTitle>
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Authorized student context active</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/planner">
              <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground">
                <CalendarCheck2 className="h-3.5 w-3.5 text-emerald-600" />
                <span>View Planner</span>
              </Button>
            </Link>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${
                msg.sender === 'user' ? 'flex-row-reverse' : ''
              }`}
            >
              <div
                className={`flex items-center justify-center h-8 w-8 rounded-full shrink-0 text-xs shadow-xs ${
                  msg.sender === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground border'
                }`}
              >
                {msg.sender === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4 text-primary" />}
              </div>

              <div
                className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-4 py-3 text-sm shadow-xs ${
                  msg.sender === 'user'
                    ? 'bg-primary text-primary-foreground rounded-tr-none'
                    : 'bg-muted/60 text-foreground border rounded-tl-none'
                }`}
              >
                <div className="leading-relaxed whitespace-pre-wrap text-xs md:text-sm">{msg.text}</div>

                {/* If AI scheduled a study task via controlled tool execution, show task card */}
                {msg.createdTask && (
                  <div className="mt-3 p-3 rounded-xl bg-background/90 border border-emerald-500/40 text-foreground shadow-xs">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-semibold text-xs flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle className="h-4 w-4" />
                        Study Task Saved to Database
                      </span>
                      <Badge variant="outline" className="text-[10px] capitalize">
                        {msg.createdTask.priority} Priority
                      </Badge>
                    </div>
                    <div className="font-medium text-xs text-foreground">{msg.createdTask.title}</div>
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-1">
                      <span>{msg.createdTask.subject_name}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDateTime(msg.createdTask.due_date)}
                      </span>
                    </div>
                    <div className="mt-2 pt-2 border-t flex justify-end">
                      <Link href="/planner" className="text-[11px] text-primary hover:underline font-semibold flex items-center gap-1">
                        Open in Study Planner &rarr;
                      </Link>
                    </div>
                  </div>
                )}

                <span
                  className={`block text-[10px] mt-1.5 text-right ${
                    msg.sender === 'user' ? 'text-primary-foreground/75' : 'text-muted-foreground'
                  }`}
                >
                  {msg.time}
                </span>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-muted text-muted-foreground border">
                <Bot className="h-4 w-4 text-primary animate-pulse" />
              </div>
              <div className="rounded-2xl rounded-tl-none px-4 py-3 bg-muted/60 border text-xs text-muted-foreground flex items-center gap-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                <span>studEZ AI is reasoning with your academic context...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </CardContent>

        <CardFooter className="border-t p-3 bg-card/80">
          <form onSubmit={handleSendMessage} className="flex w-full gap-2 items-center">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="shrink-0 h-11 w-11 text-muted-foreground hover:text-foreground"
              onClick={() => setUploadOpen(true)}
              title="Upload study material / notes"
            >
              <Paperclip className="h-4 w-4" />
            </Button>

            <Textarea
              placeholder="Ask anything about your coursework, exam timetable, or ask to schedule a study task..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[44px] max-h-28 resize-none text-xs md:text-sm py-2.5 bg-background"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSendMessage(e)
                }
              }}
            />

            <Button
              type="submit"
              size="icon"
              className="shrink-0 h-11 w-11 shadow-sm"
              disabled={!message.trim() || loading}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  )
}
