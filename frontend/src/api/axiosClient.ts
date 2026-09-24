import axios from 'axios'
import i18n from '@/i18n'

/**
 * Base axios instance for every API call in the app.
 *
 * withCredentials: true lets the browser send/receive the Sanctum
 * session + XSRF-TOKEN cookies on cross-origin requests (Vite dev
 * server on :5173 talking to Laravel on :8000).
 *
 * withXSRFToken: true tells axios to also ATTACH the X-XSRF-TOKEN
 * header automatically (reading it from the XSRF-TOKEN cookie) even
 * though this is a cross-origin request - without it axios only does
 * this for same-origin requests by default, and every POST/PUT/PATCH/
 * DELETE would get rejected with a 419 CSRF error.
 */
const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8000',
  withCredentials: true,
  withXSRFToken: true,
  headers: {
    Accept: 'application/json',
  },
})

/**
 * Tell the API which language to answer in (Phase 27).
 *
 * Set per request rather than once at creation, because the language can
 * change at any moment and a header baked in at module load would be
 * stale for the rest of the session.
 *
 * Read from i18n rather than from localStorage: i18next is the source of
 * truth for what the person is currently LOOKING at, and the two can
 * legitimately differ for a moment while a switch is being saved.
 *
 * Accept-Language rather than a custom header on purpose — it is
 * CORS-safelisted, so it triggers no preflight and needs no entry in the
 * backend's config/cors.php. The backend validates it against
 * App\Enums\Locale and ignores anything it does not recognise, so this
 * can never put an arbitrary string into App::setLocale().
 */
axiosClient.interceptors.request.use((config) => {
  config.headers.set('Accept-Language', i18n.language)
  return config
})

export default axiosClient
