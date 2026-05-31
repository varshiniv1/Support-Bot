export default function MessageBubble({ message }) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className="max-w-[80%]">
        {!isUser && (
          <p className="text-xs text-gray-500 mb-1 ml-1">Support Bot</p>
        )}
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
            isUser
              ? 'bg-indigo-600 text-white rounded-tr-sm'
              : 'bg-gray-800 text-gray-100 rounded-tl-sm'
          }`}
        >
          {message.content}
        </div>

        {!isUser && message.sources?.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {message.sources.slice(0, 3).map((src, i) => (
              <span
                key={i}
                title={src.content.slice(0, 200)}
                className="text-xs bg-gray-900 border border-gray-700 text-gray-400 rounded-full px-2.5 py-0.5 cursor-help hover:border-gray-500 transition-colors"
              >
                Source {i + 1} · {(src.score * 100).toFixed(0)}% match
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
