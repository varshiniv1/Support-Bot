import { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import FollowUpChips from './FollowUpChips'
import MessageBubble from './MessageBubble'

const WELCOME = {
  id: 0,
  role: 'assistant',
  content: "Hi! I'm your Support Bot 👋\nAsk me anything about your knowledge base. I use hybrid search to find the most relevant answers.",
  sources: [],
  followUps: [],
}

export default function ChatWindow() {
  const [messages, setMessages] = useState([WELCOME])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function send(question) {
    const q = question.trim()
    if (!q || loading) return

    setMessages(prev => [...prev, { id: Date.now(), role: 'user', content: q, sources: [], followUps: [] }])
    setInput('')
    setLoading(true)

    try {
      const history = messages
        .filter(m => m.id !== 0)
        .map(m => ({ role: m.role, content: m.content }))

      const { data } = await axios.post('/api/chat', {
        question: q,
        conversation_history: history,
      })

      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        content: data.answer,
        sources: data.sources,
        followUps: data.follow_up_questions,
      }])
    } catch {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        content: 'Something went wrong. Please make sure the backend is running and try again.',
        sources: [],
        followUps: [],
      }])
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  return (
    <div className="flex flex-col flex-1 h-screen min-w-0 bg-slate-50">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 bg-white border-b border-slate-200 shadow-sm flex-shrink-0">
        <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white text-sm shadow-sm">
          S
        </div>
        <div>
          <h1 className="font-semibold text-slate-900 leading-tight">Support Bot</h1>
          <p className="text-xs text-slate-400 leading-tight">Hybrid search · Groq LLM</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-1 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Online
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
        {messages.map(msg => (
          <div key={msg.id}>
            <MessageBubble message={msg} />
            {msg.role === 'assistant' && msg.followUps?.length > 0 && (
              <FollowUpChips questions={msg.followUps} onSelect={send} disabled={loading} />
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-1 shadow-sm">
              S
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
              <div className="flex gap-1 items-center h-4">
                <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.3s]" />
                <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.15s]" />
                <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 px-6 py-4 bg-white border-t border-slate-200">
        <form
          onSubmit={e => { e.preventDefault(); send(input) }}
          className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-3 border border-slate-300 focus-within:border-indigo-400 focus-within:ring-3 focus-within:ring-indigo-100 transition-all"
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask a question about your knowledge base…"
            disabled={loading}
            className="flex-1 bg-transparent outline-none text-sm text-slate-800 placeholder-slate-400 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="w-8 h-8 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 flex items-center justify-center transition-colors flex-shrink-0"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-4 h-4 ${loading || !input.trim() ? 'text-slate-400' : 'text-white'}`}>
              <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
            </svg>
          </button>
        </form>
        <p className="text-xs text-slate-400 text-center mt-2">
          Powered by Groq · sentence-transformers · Supabase pgvector
        </p>
      </div>
    </div>
  )
}
