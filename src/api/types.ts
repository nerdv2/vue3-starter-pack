/**
 * Shared API types mirroring the Slim backend contract.
 */

/** The standard response envelope from `App\Helper\JsonResponse`. */
export interface ApiEnvelope<T> {
  status: boolean
  message: string
  data: T
  total_page?: number
  total_data?: number
}

export type UserRole = 'admin' | 'staff'

export interface User {
  id: number
  name: string
  email: string
  type: UserRole
  last_login_at: string | null
  created_at: string | null
}

export interface AuthSession {
  access_token: string
  token_type: string
  expires_in: number
  user: User
}

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  name: string
  email: string
  password: string
  password_confirmation: string
}

export interface ChangePasswordPayload {
  current_password: string
  new_password: string
  new_password_confirmation: string
}

export type CustomerStatus = 'lead' | 'prospect' | 'active' | 'inactive'

export const CUSTOMER_STATUSES: readonly CustomerStatus[] = [
  'lead',
  'prospect',
  'active',
  'inactive',
]

export const CUSTOMER_STATUS_LABELS: Record<CustomerStatus, string> = {
  lead: 'Lead',
  prospect: 'Prospect',
  active: 'Active',
  inactive: 'Inactive',
}

export interface Customer {
  id: number
  name: string
  email: string | null
  phone: string | null
  company: string | null
  status: CustomerStatus
  address: string | null
  notes: string | null
  avatar_url: string | null
  created_at: string | null
  updated_at: string | null
}

export interface CustomerPayload {
  name: string
  email: string | null
  phone: string | null
  company: string | null
  status: CustomerStatus
  address: string | null
  notes: string | null
}

export interface CustomerListParams {
  page?: number
  limit?: number
  keywords?: string
  status?: CustomerStatus | ''
}

export interface CustomerStats {
  total: number
  by_status: Record<CustomerStatus, number>
  created_last_7_days: number
}

export interface Paged<T> {
  data: T[]
  total_page: number
  total_data: number
}

export type JobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'

export interface ImportError {
  row: number
  message: string
}

export interface ExportResult {
  file_name: string
  row_count: number
  generated_at: string
}

export interface ImportResult {
  total: number
  imported: number
  skipped: number
  failed: number
  errors: ImportError[]
}

export interface Job {
  id: number
  type: string
  status: JobStatus
  attempts: number
  max_attempts: number
  progress: number | null
  progress_message: string | null
  result: ExportResult | ImportResult | null
  error_message: string | null
  created_at: string | null
  started_at: string | null
  completed_at: string | null
  download_url?: string
}

export interface ExportPayload {
  keywords: string
  status: CustomerStatus | null
}

export interface ExportQueued {
  job_id: number
  status: string
  total_rows: number
}

export interface ImportQueued {
  job_id: number
  status: string
  file_name: string
}

export function isExportResult(result: Job['result']): result is ExportResult {
  return result !== null && 'row_count' in result
}

export function isImportResult(result: Job['result']): result is ImportResult {
  return result !== null && 'imported' in result
}
