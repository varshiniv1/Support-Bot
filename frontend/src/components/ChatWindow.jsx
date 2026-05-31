import { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import FollowUpChips from './FollowUpChips'
import MessageBubble from './MessageBubble'

const WELCOME = {
  id: 0,
  role: 'assistant',
  content: "Hi! I'm your Support Bot. Ask me anything about your knowledge base.",
  sources: [],
  followUps: [],
}

export default function ChatWindow() {
  const [messages, setMessages] = useState([WELCOME])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

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
        content: 'Something went wrong. Please try again.',
        sources: [],
        followUps: [],
      }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col flex-1 h-screen min-w-0">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-800 flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-sm select-none">
          S
        </div>
        <h1 className="font-semibold">Support Bot</h1>
        <span className="ml-auto text-xs text-gray-500">Hybrid search · Groq LLM · Free</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-5">
        {messages.map(msg => (
          <div key={msg.id}>
            <MessageBubble message={msg} />
            {msg.role === 'assistant' && msg.followUps?.length > 0 && (
              <FollowUpChips questions={msg.followUps} onSelect={send} disabled={loading} />
            )}
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-800 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1.5 items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={e => { e.preventDefault(); send(input) }}
        className="flex-shrink-0 px-4 py-4 border-t border-gray-800"
      >
        <div className="flex items-center gap-3 bg-gray-900 rounded-xl px-4 py-3 border border-gray-700 focus-within:border-indigo-500 transition-colors">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask a question about your knowledge base…"
            disabled={loading}
            className="flex-1 bg-transparent outline-none text-sm placeholder-gray-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="text-indigo-400 hover:text-indigo-300 disabled:opacity-30 transition-colors flex-shrink-0"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  )
}
