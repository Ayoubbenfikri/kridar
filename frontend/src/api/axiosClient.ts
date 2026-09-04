import axios from 'axios'

/**
 * Base axios instance for every API call in the app.
 *
 * withCredentials: true is what lets the browser send/receive the
 * Sanctum session + XSRF-TOKEN cookies on cross-origin requests (the
 * Vite dev server on :5173 talking to Laravel on :8000). Without it,
 * Sanctum's SPA cookie auth simply doesn't work.
 */
const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8000',
  withCredentials: true,
  headers: {
    Accept: 'application/json',
  },
})

export default axiosClient
