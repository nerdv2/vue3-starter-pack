import type { ApiEnvelope } from './types'

/**
 * Fetch wrapper for the Customer DB API.
 *
 * - Keeps the short-lived access token in memory only; the refresh token lives
 *   in an HttpOnly cookie, so every request is sent with `credentials: include`.
 * - On a 401 it refreshes the session once (single-flight, concurrent requests
 *   share one refresh) and replays the original request.
 * - When the refresh fails, the unauthorized handler registered at boot clears
 *   the session and redirects to the login page.
 */

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/+$/, '')

export type QueryValue = string | number | boolean | null | undefined

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  formData?: FormData
  query?: Record<string, QueryValue>
  /** Send the Authorization header (default true). */
  auth?: boolean
  /** Internal: prevents an infinite refresh/retry loop. */
  retryOnUnauthorized?: boolean
}

export class ApiError extends Error {
  readonly status: number
  readonly data: unknown

  constructor(message: string, status: number, data: unknown = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }

  /** Field-keyed validation messages from the backend, when present. */
  get fieldErrors(): Record<string, string> {
    if (this.data !== null && typeof this.data === 'object' && !Array.isArray(this.data)) {
      const entries = Object.entries(this.data as Record<string, unknown>).filter(
        (entry): entry is [string, string] => typeof entry[1] === 'string',
      )

      return Object.fromEntries(entries)
    }

    return {}
  }
}

let accessToken: string | null = null

let refreshPromise: Promise<boolean> | null = null

let unauthorizedHandler: (() => void) | null = null

export function setAccessToken(token: string | null): void {
  accessToken = token
}

export function getAccessToken(): string | null {
  return accessToken
}

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  unauthorizedHandler = handler
}

export function apiBaseUrl(): string {
  return API_BASE_URL
}

function buildUrl(path: string, query?: Record<string, QueryValue>): string {
  const url = new URL(`${API_BASE_URL}${path}`, window.location.origin)
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value))
      }
    }
  }

  return url.toString()
}

async function safeJson(response: Response): Promise<ApiEnvelope<unknown> | null> {
  try {
    const payload: unknown = await response.json()

    return payload !== null && typeof payload === 'object'
      ? (payload as ApiEnvelope<unknown>)
      : null
  } catch {
    return null
  }
}

/**
 * Refresh the session using the HttpOnly cookie. Concurrent callers share one
 * in-flight refresh request.
 */
export function refreshSession(): Promise<boolean> {
  refreshPromise ??= (async (): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: { Accept: 'application/json' },
      })
      if (!response.ok) {
        setAccessToken(null)

        return false
      }

      const payload = await safeJson(response)
      const token = payload?.data
      const sessionToken =
        token !== null && typeof token === 'object'
          ? (token as Record<string, unknown>).access_token
          : undefined
      if (typeof sessionToken !== 'string' || sessionToken === '') {
        setAccessToken(null)

        return false
      }

      setAccessToken(sessionToken)

      return true
    } catch {
      setAccessToken(null)

      return false
    } finally {
      refreshPromise = null
    }
  })()

  return refreshPromise
}

/**
 * Low-level request with automatic refresh-and-retry. Returns the raw response
 * so binary downloads can reuse the same auth flow.
 */
export async function request(path: string, options: RequestOptions = {}): Promise<Response> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  let body: BodyInit | undefined

  if (options.formData) {
    body = options.formData
  } else if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json'
    body = JSON.stringify(options.body)
  }

  const sendAuth = options.auth !== false
  if (sendAuth && accessToken !== null) {
    headers.Authorization = `Bearer ${accessToken}`
  }

  const response = await fetch(buildUrl(path, options.query), {
    method: options.method ?? 'GET',
    headers,
    body,
    credentials: 'include',
  })

  if (response.status === 401 && sendAuth && options.retryOnUnauthorized !== false) {
    const refreshed = await refreshSession()
    if (refreshed) {
      return request(path, { ...options, retryOnUnauthorized: false })
    }

    unauthorizedHandler?.()
  }

  return response
}

/** JSON request that unwraps the standard envelope or throws `ApiError`. */
export async function apiFetch<T>(
  path: string,
  options: RequestOptions = {},
): Promise<ApiEnvelope<T>> {
  const response = await request(path, options)
  const payload = await safeJson(response)

  if (!response.ok || payload === null || payload.status === false) {
    throw new ApiError(
      payload?.message ?? `Request failed with status ${response.status}.`,
      response.status,
      payload?.data ?? null,
    )
  }

  return payload as ApiEnvelope<T>
}

/** Authenticated file download that honors the Content-Disposition filename. */
export async function downloadFile(path: string, fallbackName: string): Promise<void> {
  const response = await request(path)
  if (!response.ok) {
    const payload = await safeJson(response)
    throw new ApiError(
      payload?.message ?? `Download failed with status ${response.status}.`,
      response.status,
      payload?.data ?? null,
    )
  }

  const disposition = response.headers.get('Content-Disposition') ?? ''
  const match = /filename="?([^";]+)"?/.exec(disposition)
  const blob = await response.blob()
  const objectUrl = URL.createObjectURL(blob)

  const anchor = document.createElement('a')
  anchor.href = objectUrl
  anchor.download = match?.[1] ?? fallbackName
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(objectUrl)
}
