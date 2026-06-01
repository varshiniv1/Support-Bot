import { useEffect, useRef, useState } from 'react'
import axios from 'axios'

const TABS = ['Browse', 'Markdown', 'URL', 'PDF']

const SOURCE_ICONS = { markdown: '📝', pdf: '📄', url: '🔗' }

export default function KnowledgePanel({ onIngest, refreshKey }) {
  const [tab, setTab] = useState('Browse')
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)

  const [mdTitle, setMdTitle] = useState('')
  const [mdContent, setMdContent] = useState('')
  const [urlInput, setUrlInput] = useState('')
  const fileRef = useRef()

  useEffect(() => {
    if (tab === 'Browse') fetchDocs()
  }, [tab, refreshKey])

  async function fetchDocs() {
    try {
      const { data } = await axios.get('/api/documents')
      setDocs(data)
    } catch {}
  }

  function notify(text, ok = true) {
    setToast({ text, ok })
    setTimeout(() => setToast(null), 3500)
  }

  async function ingestMarkdown(e) {
    e.preventDefault()
    setLoading(true)
    try {
      await axios.post('/api/ingest/markdown', { title: mdTitle, content: mdContent })
      notify('Markdown indexed successfully!')
      setMdTitle(''); setMdContent('')
      onIngest?.(); setTab('Browse')
    } catch (err) {
      notify(err.response?.data?.detail || 'Failed to index markdown', false)
    } finally { setLoading(false) }
  }

  async function ingestURL(e) {
    e.preventDefault()
    setLoading(true)
    try {
      await axios.post('/api/ingest/url', { url: urlInput })
      notify('URL scraped and indexed!')
      setUrlInput(''); onIngest?.(); setTab('Browse')
    } catch (err) {
      notify(err.response?.data?.detail || 'Failed to scrape URL', false)
    } finally { setLoading(false) }
  }

  async function ingestPDF(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    const form = new FormData()
    form.append('file', file)
    try {
      await axios.post('/api/ingest/pdf', form)
      notify('PDF indexed successfully!')
      onIngest?.(); setTab('Browse')
    } catch (err) {
      notify(err.response?.data?.detail || 'Failed to index PDF', false)
    } finally {
      setLoading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function deleteDoc(id) {
    try { await axios.delete(`/api/documents/${id}`); fetchDocs() } catch {}
  }

  return (
    <aside className="w-72 flex-shrink-0 flex flex-col h-screen bg-white border-r border-slate-200 shadow-sm">
      {/* Header */}
      <div className="px-5 py-5 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-4 h-4">
              <path d="M11.25 4.533A9.707 9.707 0 006 3a9.735 9.735 0 00-3.25.555.75.75 0 00-.5.707v14.25a.75.75 0 001 .707A8.237 8.237 0 016 18.75c1.995 0 3.823.707 5.25 1.886V4.533zM12.75 20.636A8.214 8.214 0 0118 18.75c.966 0 1.89.166 2.75.47a.75.75 0 001-.708V4.262a.75.75 0 00-.5-.707A9.735 9.735 0 0018 3a9.707 9.707 0 00-5.25 1.533v16.103z" />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Knowledge Base</h2>
            <p className="text-xs text-slate-400">{docs.length} document{docs.length !== 1 ? 's' : ''} indexed</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex px-3 pt-3 gap-1">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-1.5 text-xs rounded-lg font-medium transition-all ${
              tab === t
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Toast */}
      {toast && (
        <div className={`mx-4 mt-3 text-xs rounded-xl px-3 py-2.5 font-medium flex items-center gap-2 ${
          toast.ok
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          <span>{toast.ok ? '✅' : '❌'}</span>
          {toast.text}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {tab === 'Browse' && (
          <div className="space-y-2">
            {docs.length === 0 ? (
              <div className="text-center py-10">
                <div className="text-3xl mb-2">📚</div>
                <p className="text-sm text-slate-500 font-medium">No documents yet</p>
                <p className="text-xs text-slate-400 mt-1">Add sources using the tabs above</p>
              </div>
            ) : (
              docs.map(doc => (
                <div
                  key={doc.id}
                  className="group bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-3 py-2.5 flex items-start gap-2.5 transition-all cursor-default"
                >
                  <span className="text-base mt-0.5 flex-shrink-0">{SOURCE_ICONS[doc.source_type] || '📄'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800 truncate">{doc.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5 capitalize">
                      {doc.source_type} · {new Date(doc.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => deleteDoc(doc.id)}
                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all flex-shrink-0 mt-0.5"
                    title="Delete"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                      <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'Markdown' && (
          <form onSubmit={ingestMarkdown} className="space-y-3">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Title</label>
              <input
                type="text"
                placeholder="e.g. Getting Started Guide"
                value={mdTitle}
                onChange={e => setMdTitle(e.target.value)}
                required
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all placeholder-slate-400"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Content</label>
              <textarea
                placeholder="Paste markdown content here…"
                value={mdContent}
                onChange={e => setMdContent(e.target.value)}
                rows={9}
                required
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all resize-none font-mono placeholder-slate-400"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-lg py-2.5 text-sm font-semibold transition-colors shadow-sm"
            >
              {loading ? 'Indexing…' : 'Index Markdown'}
            </button>
          </form>
        )}

        {tab === 'URL' && (
          <form onSubmit={ingestURL} className="space-y-3">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">URL</label>
              <input
                type="url"
                placeholder="https://docs.example.com/page"
                value={urlInput}
                onChange={e => setUrlInput(e.target.value)}
                required
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all placeholder-slate-400"
              />
            </div>
            <p className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
              🔍 The page will be scraped with <strong>trafilatura</strong> and chunked automatically.
            </p>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-lg py-2.5 text-sm font-semibold transition-colors shadow-sm"
            >
              {loading ? 'Scraping…' : 'Scrape & Index URL'}
            </button>
          </form>
        )}

        {tab === 'PDF' && (
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => !loading && fileRef.current?.click()}
              disabled={loading}
              className="w-full border-2 border-dashed border-slate-300 hover:border-indigo-400 hover:bg-indigo-50 rounded-xl p-8 text-center transition-all disabled:opacity-50 group"
            >
              <div className="text-4xl mb-3">📤</div>
              <p className="text-sm font-semibold text-slate-600 group-hover:text-indigo-600 transition-colors">
                {loading ? 'Uploading…' : 'Click to upload PDF'}
              </p>
              <p className="text-xs text-slate-400 mt-1">PDF files only · any size</p>
            </button>
            <input ref={fileRef} type="file" accept=".pdf" onChange={ingestPDF} className="hidden" />
            <p className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
              📄 Parsed with <strong>PyMuPDF</strong>, chunked and embedded automatically.
            </p>
          </div>
        )}
      </div>
    </aside>
  )
}
