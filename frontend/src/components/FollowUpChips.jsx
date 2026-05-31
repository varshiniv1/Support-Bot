export default function FollowUpChips({ questions, onSelect, disabled }) {
  if (!questions?.length) return null

  return (
    <div className="mt-3 ml-1 flex flex-wrap gap-2">
      {questions.map((q, i) => (
        <button
          key={i}
          onClick={() => onSelect(q)}
          disabled={disabled}
          className="text-xs border border-indigo-500/40 text-indigo-300 rounded-full px-3 py-1.5 bg-indigo-500/5 hover:bg-indigo-500/15 hover:border-indigo-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed text-left"
        >
          {q}
        </button>
      ))}
    </div>
  )
}
