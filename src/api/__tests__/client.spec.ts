import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  ApiError,
  apiFetch,
  refreshSession,
  setAccessToken,
  setUnauthorizedHandler,
} from '@/api/client'

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

afterEach(() => {
  vi.restoreAllMocks()
  setAccessToken(null)
  setUnauthorizedHandler(null)
})

describe('ApiError', () => {
  it('exposes string field errors only', () => {
    const error = new ApiError('Validation failed.', 400, {
      name: 'Name is required.',
      nested: { deep: true },
    })

    expect(error.fieldErrors).toEqual({ name: 'Name is required.' })
    expect(error.message).toBe('Validation failed.')
    expect(error.status).toBe(400)
  })

  it('returns no field errors for non-object payloads', () => {
    expect(new ApiError('Boom', 500, []).fieldErrors).toEqual({})
  })
})

describe('refreshSession', () => {
  it('shares one refresh request between concurrent callers', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        jsonResponse({ status: true, message: 'ok', data: { access_token: 'fresh-token' } }),
      )

    const [first, second] = await Promise.all([refreshSession(), refreshSession()])

    expect(first).toBe(true)
    expect(second).toBe(true)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('fails when the cookie cannot restore the session', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('', { status: 401 }))

    await expect(refreshSession()).resolves.toBe(false)
  })
})

describe('apiFetch', () => {
  it('refreshes once on 401 and replays the request', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response('', { status: 401 }))
      .mockResolvedValueOnce(
        jsonResponse({ status: true, message: 'ok', data: { access_token: 'fresh' } }),
      )
      .mockResolvedValueOnce(
        jsonResponse({ status: true, message: 'Data ditemukan', data: { id: 1 } }),
      )

    const response = await apiFetch<{ id: number }>('/customer/1')

    expect(response.data).toEqual({ id: 1 })
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it('throws an ApiError carrying the envelope message', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({ status: false, message: 'Customer not found.', data: [] }, 404),
    )

    await expect(apiFetch('/customer/99', { retryOnUnauthorized: false })).rejects.toMatchObject({
      status: 404,
      message: 'Customer not found.',
    })
  })

  it('notifies the unauthorized handler when the refresh fails', async () => {
    const handler = vi.fn<() => void>()
    setUnauthorizedHandler(handler)

    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response('', { status: 401 }))
      .mockResolvedValueOnce(new Response('', { status: 401 }))

    await expect(apiFetch('/customer')).rejects.toBeInstanceOf(ApiError)
    expect(handler).toHaveBeenCalledTimes(1)
  })
})
