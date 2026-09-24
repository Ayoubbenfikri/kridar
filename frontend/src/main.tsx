import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/index.css'
// Imported for its side effects, and BEFORE App: i18next has to be
// initialised before the first component renders, or useTranslation()
// runs against an empty instance and the first paint is untranslated.
// It also sets <html lang> and <html dir> straight away, so the page is
// never briefly laid out left-to-right in Darija.
import '@/i18n'
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
