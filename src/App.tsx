import { useState } from 'react'
import { HomePage } from './components/HomePage'
import './index.css'

type Page = 'home' | 'history'

function HistoryPage({ onBack }: { onBack: () => void }) {
  return (
    <>
      <header>
        <div>
          <img src="/foot.svg" alt="" aria-hidden="true" />
          Riwayat
        </div>
      </header>
      <main>
        <p style={{ color: 'var(--fg-dim)', textAlign: 'center', marginTop: '48px' }}>
          Grafik riwayat akan hadir di sini.
        </p>
      </main>
      <footer>
        <div className="footer-links">
          <button onClick={onBack} aria-label="Kembali">← Kembali</button>
        </div>
      </footer>
    </>
  )
}

function App() {
  const [page, setPage] = useState<Page>('home')

  if (page === 'history') return <HistoryPage onBack={() => setPage('home')} />
  return <HomePage onNavigate={setPage} />
}

export default App
