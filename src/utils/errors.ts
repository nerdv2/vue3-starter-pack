import { ApiError } from '@/api/client'

export function errorMessage(error: unknown, fallback = 'Something went wrong.'): string {
  return error instanceof ApiError ? error.message : fallback
}

export function errorFields(error: unknown): Record<string, string> {
  return error instanceof ApiError ? error.fieldErrors : {}
}
