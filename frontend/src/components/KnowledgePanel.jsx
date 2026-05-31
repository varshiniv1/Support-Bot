import { useEffect, useRef, useState } from 'react'
import axios from 'axios'

const TABS = ['Browse', 'Markdown', 'URL', 'PDF']

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
      notify('Markdown indexed!')
      setMdTitle('')
      setMdContent('')
      onIngest?.()
      setTab('Browse')
    } catch (err) {
      notify(err.response?.data?.detail || 'Failed to index markdown', false)
    } finally {
      setLoading(false)
    }
  }

  async function ingestURL(e) {
    e.preventDefault()
    setLoading(true)
    try {
      await axios.post('/api/ingest/url', { url: urlInput })
      notify('URL scraped and indexed!')
      setUrlInput('')
      onIngest?.()
      setTab('Browse')
    } catch (err) {
      notify(err.response?.data?.detail || 'Failed to scrape URL', false)
    } finally {
      setLoading(false)
    }
  }

  async function ingestPDF(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    const form = new FormData()
    form.append('file', file)
    try {
      await axios.post('/api/ingest/pdf', form)
      notify('PDF indexed!')
      onIngest?.()
      setTab('Browse')
    } catch (err) {
      notify(err.response?.data?.detail || 'Failed to index PDF', false)
    } finally {
      setLoading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function deleteDoc(id) {
    try {
      await axios.delete(`/api/documents/${id}`)
      fetchDocs()
    } catch {}
  }

  return (
    <aside className="w-72 flex-shrink-0 flex flex-col h-screen border-r border-gray-800 bg-gray-900">
      {/* Header */}
      <div className="px-4 py-4 border-b border-gray-800">
        <h2 className="text-sm font-semibold text-gray-200">Knowledge Base</h2>
        <p className="text-xs text-gray-500 mt-0.5">Index sources to search</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-800">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 text-xs transition-colors ${
              tab === t
                ? 'text-indigo-400 border-b-2 border-indigo-500 -mb-px'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Toast */}
      {toast && (
        <div className={`mx-4 mt-3 text-xs rounded-lg px-3 py-2 ${
          toast.ok ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'
        }`}>
          {toast.text}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {tab === 'Browse' && (
          <div className="space-y-2">
            {docs.length === 0 ? (
              <p className="text-xs text-gray-600 text-center py-10">
                No documents yet.<br />Add sources using the tabs above.
              </p>
            ) : (
              docs.map(doc => (
                <div
                  key={doc.id}
                  className="group bg-gray-800 hover:bg-gray-750 rounded-lg px-3 py-2.5 flex items-start gap-2 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-200 truncate">{doc.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5 capitalize">
                      {doc.source_type} · {new Date(doc.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => deleteDoc(doc.id)}
                    className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all flex-shrink-0 mt-0.5"
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
            <input
              type="text"
              placeholder="Document title"
              value={mdTitle}
              onChange={e => setMdTitle(e.target.value)}
              required
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 transition-colors placeholder-gray-500"
            />
            <textarea
              placeholder="Paste markdown content here…"
              value={mdContent}
              onChange={e => setMdContent(e.target.value)}
              rows={10}
              required
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 transition-colors resize-none font-mono placeholder-gray-500"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 rounded-lg py-2 text-sm font-medium transition-colors"
            >
              {loading ? 'Indexing…' : 'Index Markdown'}
            </button>
          </form>
        )}

        {tab === 'URL' && (
          <form onSubmit={ingestURL} className="space-y-3">
            <input
              type="url"
              placeholder="https://docs.example.com/page"
              value={urlInput}
              onChange={e => setUrlInput(e.target.value)}
              required
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 transition-colors placeholder-gray-500"
            />
            <p className="text-xs text-gray-500">
              The page will be scraped with trafilatura and indexed automatically.
            </p>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 rounded-lg py-2 text-sm font-medium transition-colors"
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
              className="w-full border-2 border-dashed border-gray-700 hover:border-indigo-500/60 rounded-xl p-8 text-center transition-colors disabled:opacity-50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 mx-auto text-gray-600 mb-2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12l-3-3m0 0l-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              <p className="text-sm text-gray-500">{loading ? 'Uploading…' : 'Click to upload PDF'}</p>
              <p className="text-xs text-gray-600 mt-1">PDF files only</p>
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf"
              onChange={ingestPDF}
              className="hidden"
            />
          </div>
        )}
      </div>
    </aside>
  )
}
