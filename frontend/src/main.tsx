import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/index.css'
// Leaflet ships its own CSS for the map container, tiles, markers and
// controls - without it the map renders as a blank grey box with the
// tiles stacked in the top-left corner instead of filling the container.
// Imported once here, globally, so every map component in the app
// (LocationPicker now, others later) can rely on it already being
// loaded rather than each importing it themselves.
import 'leaflet/dist/leaflet.css'
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
