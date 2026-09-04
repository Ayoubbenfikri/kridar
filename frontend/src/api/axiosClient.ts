import axios from 'axios'

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

export default axiosClient
