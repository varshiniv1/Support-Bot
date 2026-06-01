export default function MessageBubble({ message }) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-1 shadow-sm">
          S
        </div>
      )}

      <div className={`max-w-[75%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1.5`}>
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${
            isUser
              ? 'bg-indigo-600 text-white rounded-tr-sm'
              : 'bg-white text-slate-800 rounded-tl-sm border border-slate-200'
          }`}
        >
          {message.content}
        </div>

        {!isUser && message.sources?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 ml-1">
            {message.sources.slice(0, 3).map((src, i) => (
              <span
                key={i}
                title={src.content.slice(0, 200)}
                className="text-xs bg-slate-100 border border-slate-200 text-slate-500 rounded-full px-2.5 py-0.5 cursor-help hover:bg-slate-200 transition-colors"
              >
                📄 Source {i + 1} · {(src.score * 100).toFixed(0)}%
              </span>
            ))}
          </div>
        )}
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-xs font-bold flex-shrink-0 mt-1">
          U
        </div>
      )}
    </div>
  )
}
