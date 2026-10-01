import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { requestPersist } from './data/sessionStore'
import App from './App.tsx'

requestPersist().catch(console.error)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)