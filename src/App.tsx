import { useState } from 'react'
import { HomePage } from './components/HomePage'
import { HistoryPage } from './components/HistoryPage'
import './index.css'

type Page = 'home' | 'history'

function App() {
  const [page, setPage] = useState<Page>('home')

  if (page === 'history') return <HistoryPage onBack={() => setPage('home')} />
  return <HomePage onNavigate={setPage} />
}

export default App
