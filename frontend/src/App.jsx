import { useState } from 'react'
import ChatWindow from './components/ChatWindow'
import KnowledgePanel from './components/KnowledgePanel'

export default function App() {
  const [refreshKey, setRefreshKey] = useState(0)

  return (
    <div className="flex h-screen overflow-hidden bg-gray-950">
      <KnowledgePanel onIngest={() => setRefreshKey(k => k + 1)} refreshKey={refreshKey} />
      <ChatWindow />
    </div>
  )
}
