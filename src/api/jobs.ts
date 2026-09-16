import { apiFetch } from './client'
import type { Job } from './types'

export const jobsApi = {
  status(id: number) {
    return apiFetch<Job>(`/jobs/${id}`)
  },
}
