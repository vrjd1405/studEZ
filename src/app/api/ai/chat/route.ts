import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getDb } from '@/lib/server/db'
import { requireAuth } from '@/lib/server/auth'
import { queryAIStudyAssistant } from '@/lib/server/ai-service'

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req)
    const body = await req.json()
    const { message, conversationId, model } = body

    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 })
    }

    const db = getDb()
    let convId = conversationId

    // Ensure conversation exists or create one
    if (!convId) {
      convId = `conv-${Date.now()}`
      const now = new Date().toISOString()
      await db.execute({
        sql: `INSERT INTO ai_conversations (id, user_id, title, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?)`,
        args: [convId, user.id, message.slice(0, 40), now, now],
      })
    }

    // Fetch conversation message history
    const historyResult = await db.execute({
      sql: `SELECT sender, text FROM ai_messages WHERE conversation_id = ? ORDER BY created_at ASC LIMIT 10`,
      args: [convId],
    })

    const history = historyResult.rows.map((r: any) => ({
      sender: String(r.sender),
      text: String(r.text),
    }))

    // Save user message to database
    const userMsgId = `msg-u-${Date.now()}`
    const now = new Date().toISOString()
    await db.execute({
      sql: `INSERT INTO ai_messages (id, conversation_id, sender, text, created_at) VALUES (?, ?, 'user', ?, ?)`,
      args: [userMsgId, convId, message.trim(), now],
    })

    // Process with AI assistant (Gemma / DigitalOcean / Groq open-source engine)
    const aiResult = await queryAIStudyAssistant(user, history, message.trim(), model)

    // Save assistant reply to database
    const aiMsgId = `msg-ai-${Date.now()}`
    await db.execute({
      sql: `INSERT INTO ai_messages (id, conversation_id, sender, text, tool_calls, created_at)
            VALUES (?, ?, 'ai', ?, ?, ?)`,
      args: [
        aiMsgId,
        convId,
        aiResult.reply,
        aiResult.createdTask ? JSON.stringify(aiResult.createdTask) : null,
        new Date().toISOString(),
      ],
    })

    return NextResponse.json({
      conversationId: convId,
      reply: aiResult.reply,
      createdTask: aiResult.createdTask,
      provider: aiResult.provider,
      model: aiResult.model,
    })
  } catch (err: any) {
    if (err instanceof Response) return err
    console.error('AI chat endpoint error:', err)
    return NextResponse.json({ error: err.message || 'AI service unavailable' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req)
    const db = getDb()
    const url = new URL(req.url)
    const convId = url.searchParams.get('conversation_id')

    if (!convId) {
      // List user's conversations
      const convs = await db.execute({
        sql: `SELECT * FROM ai_conversations WHERE user_id = ? ORDER BY updated_at DESC LIMIT 20`,
        args: [user.id],
      })
      return NextResponse.json(convs.rows)
    }

    // Get messages for specific conversation
    const messages = await db.execute({
      sql: `SELECT * FROM ai_messages WHERE conversation_id = ? ORDER BY created_at ASC`,
      args: [convId],
    })

    return NextResponse.json(messages.rows)
  } catch (err: any) {
    if (err instanceof Response) return err
    return NextResponse.json({ error: err.message || 'Failed to fetch messages' }, { status: 500 })
  }
}
