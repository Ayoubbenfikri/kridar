import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/index.css'
import App from '@/app/App'

// Marks the document as "JavaScript is running". index.css only hides a
// .reveal element when this class is present, so a broken or blocked
// script can never leave a page blank.
document.documentElement.classList.add('js')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
