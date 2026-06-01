export default function FollowUpChips({ questions, onSelect, disabled }) {
  if (!questions?.length) return null

  return (
    <div className="ml-11 mt-2 flex flex-wrap gap-2">
      {questions.map((q, i) => (
        <button
          key={i}
          onClick={() => onSelect(q)}
          disabled={disabled}
          className="text-xs bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-full px-3 py-1.5 hover:bg-indigo-100 hover:border-indigo-300 transition-all disabled:opacity-40 disabled:cursor-not-allowed text-left font-medium"
        >
          {q}
        </button>
      ))}
    </div>
  )
}
