<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { downloadFile } from '@/api/client'
import { customersApi } from '@/api/customers'
import { jobsApi } from '@/api/jobs'
import {
  CUSTOMER_STATUSES,
  CUSTOMER_STATUS_LABELS,
  isExportResult,
  isImportResult,
  type CustomerStatus,
  type Job,
} from '@/api/types'
import AppButton from '@/components/AppButton.vue'
import AppEmptyState from '@/components/AppEmptyState.vue'
import JobProgress from '@/components/JobProgress.vue'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import { errorMessage } from '@/utils/errors'
import { formatFileSize, formatNumber } from '@/utils/format'

interface TransferJob {
  job: Job
  kind: 'export' | 'import'
}

const auth = useAuthStore()
const toast = useToastStore()

const jobs = ref<TransferJob[]>([])
const exporting = ref(false)
const importing = ref(false)
const exportStatus = ref<CustomerStatus | ''>('')
const importFile = ref<File | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const downloading = ref<number | null>(null)

let pollTimer: number | undefined

const statusOptions = computed(() => [
  { value: '', label: 'All statuses' },
  ...CUSTOMER_STATUSES.map((value) => ({ value, label: CUSTOMER_STATUS_LABELS[value] })),
])

const hasActiveJobs = computed(() =>
  jobs.value.some((entry) => entry.job.status === 'pending' || entry.job.status === 'running'),
)

function startPolling(): void {
  pollTimer ??= window.setInterval(() => {
    void pollJobs()
  }, 1200)
}

function stopPolling(): void {
  if (pollTimer !== undefined) {
    window.clearInterval(pollTimer)
    pollTimer = undefined
  }
}

async function pollJobs(): Promise<void> {
  const active = jobs.value.filter(
    (entry) => entry.job.status === 'pending' || entry.job.status === 'running',
  )

  if (active.length === 0) {
    stopPolling()

    return
  }

  await Promise.all(
    active.map(async (entry) => {
      try {
        entry.job = (await jobsApi.status(entry.job.id)).data
        if (entry.job.status === 'failed') {
          toast.error(`Job #${entry.job.id} failed: ${entry.job.error_message ?? 'unknown error'}`)
        }
      } catch {
        // Transient polling errors are ignored; the next tick retries.
      }
    }),
  )
}

onBeforeUnmount(stopPolling)

async function queueExport(): Promise<void> {
  exporting.value = true
  try {
    const response = await customersApi.export({
      keywords: '',
      status: exportStatus.value === '' ? null : exportStatus.value,
    })
    jobs.value.unshift({
      kind: 'export',
      job: {
        id: response.data.job_id,
        type: 'customer.export',
        status: 'pending',
        attempts: 0,
        max_attempts: 3,
        progress: null,
        progress_message: null,
        result: null,
        error_message: null,
        created_at: null,
        started_at: null,
        completed_at: null,
      },
    })
    toast.success(`Export queued (${formatNumber(response.data.total_rows)} rows).`)
    startPolling()
  } catch (error) {
    toast.error(errorMessage(error, 'Could not queue the export.'))
  } finally {
    exporting.value = false
  }
}

function onFileSelected(event: Event): void {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0] ?? null

  if (file === null) {
    importFile.value = null

    return
  }

  if (!file.name.toLowerCase().endsWith('.csv')) {
    toast.error('Choose a .csv file.')
    input.value = ''

    return
  }

  if (file.size > 5 * 1024 * 1024) {
    toast.error('Import files must not exceed 5 MB.')
    input.value = ''

    return
  }

  importFile.value = file
}

async function queueImport(): Promise<void> {
  const file = importFile.value
  if (file === null) {
    toast.error('Choose a CSV file first.')

    return
  }

  importing.value = true
  try {
    const response = await customersApi.import(file)
    jobs.value.unshift({
      kind: 'import',
      job: {
        id: response.data.job_id,
        type: 'customer.import',
        status: 'pending',
        attempts: 0,
        max_attempts: 3,
        progress: null,
        progress_message: null,
        result: null,
        error_message: null,
        created_at: null,
        started_at: null,
        completed_at: null,
      },
    })
    importFile.value = null
    if (fileInput.value) {
      fileInput.value.value = ''
    }
    toast.success('Import queued. The worker validates every row.')
    startPolling()
  } catch (error) {
    toast.error(errorMessage(error, 'Could not queue the import.'))
  } finally {
    importing.value = false
  }
}

async function download(job: Job): Promise<void> {
  downloading.value = job.id
  try {
    await downloadFile(`/customer/export/${job.id}/download`, `customer-export-${job.id}.csv`)
  } catch (error) {
    toast.error(errorMessage(error, 'Download failed.'))
  } finally {
    downloading.value = null
  }
}

function downloadTemplate(): void {
  const csv =
    'name,email,phone,company,status,address,notes\n' +
    '"Jane Doe",jane@example.com,+62 811 0000,Acme Inc,prospect,"Jl. Contoh 1","Optional notes"\n'
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = 'customer-import-template.csv'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div class="stack">
    <div class="page-header">
      <div class="page-title">
        <h1>Import &amp; export</h1>
        <p class="muted">
          CSV transfer runs through the background queue, so large files never block the UI.
        </p>
      </div>
    </div>

    <div class="grid">
      <section class="card">
        <header class="card__header">
          <h2>Export customers</h2>
        </header>
        <div class="card__body stack">
          <p class="muted">
            Every matching customer is streamed into a CSV with a UTF-8 BOM, including addresses and
            notes.
          </p>
          <AppSelect v-model="exportStatus" label="Status filter" :options="statusOptions" />
          <AppButton :loading="exporting" @click="queueExport">Queue export</AppButton>
          <p class="subtle">Available to staff and admins. Limit: 100,000 rows per file.</p>
        </div>
      </section>

      <section v-if="auth.isAdmin" class="card">
        <header class="card__header">
          <h2>Import customers</h2>
        </header>
        <div class="card__body stack">
          <p class="muted">
            The CSV must include a <code>name</code> column. Optional columns: <code>email</code>,
            <code>phone</code>, <code>company</code>, <code>status</code>, <code>address</code>,
            <code>notes</code>. Existing customers are skipped.
          </p>
          <input
            ref="fileInput"
            type="file"
            accept=".csv,text/csv"
            class="file"
            @change="onFileSelected"
          />
          <p v-if="importFile" class="subtle">
            {{ importFile.name }} · {{ formatFileSize(importFile.size) }}
          </p>
          <div class="row row--wrap">
            <AppButton :loading="importing" @click="queueImport">Queue import</AppButton>
            <AppButton variant="ghost" @click="downloadTemplate">Download template</AppButton>
          </div>
        </div>
      </section>
    </div>

    <section class="card">
      <header class="card__header">
        <h2>Jobs</h2>
        <span v-if="hasActiveJobs" class="muted">Refreshing…</span>
      </header>
      <AppEmptyState
        v-if="jobs.length === 0"
        title="No jobs in this session"
        description="Queued exports and imports appear here with live progress."
      />
      <div v-else class="card__body jobs">
        <article v-for="entry in jobs" :key="`${entry.kind}-${entry.job.id}`" class="job-entry">
          <header class="job-entry__head">
            <h3>{{ entry.kind === 'export' ? 'Export' : 'Import' }} job #{{ entry.job.id }}</h3>
            <span class="spacer" />
            <AppButton
              v-if="entry.kind === 'export' && entry.job.status === 'completed'"
              size="sm"
              variant="secondary"
              :loading="downloading === entry.job.id"
              @click="download(entry.job)"
            >
              Download CSV
            </AppButton>
          </header>

          <JobProgress :job="entry.job" />

          <div
            v-if="entry.job.status === 'completed' && isExportResult(entry.job.result)"
            class="job-entry__summary"
          >
            <span class="badge badge--neutral">
              {{ formatNumber(entry.job.result.row_count) }} rows
            </span>
          </div>

          <div
            v-if="entry.job.status === 'completed' && isImportResult(entry.job.result)"
            class="job-entry__summary"
          >
            <span class="badge badge--success">{{ entry.job.result.imported }} imported</span>
            <span class="badge badge--neutral">{{ entry.job.result.skipped }} skipped</span>
            <span
              class="badge"
              :class="entry.job.result.failed > 0 ? 'badge--danger' : 'badge--neutral'"
            >
              {{ entry.job.result.failed }} failed
            </span>
          </div>

          <div
            v-if="
              entry.job.status === 'completed' &&
              isImportResult(entry.job.result) &&
              entry.job.result.errors.length > 0
            "
            class="errors"
          >
            <table class="table">
              <thead>
                <tr>
                  <th>Row</th>
                  <th>Problem</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="error in entry.job.result.errors" :key="`${error.row}-${error.message}`">
                  <td>{{ error.row }}</td>
                  <td>{{ error.message }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>

<style scoped>
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 1rem;
  align-items: start;
}

.file {
  font-size: 0.9rem;
}

.jobs {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.job-entry {
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 0.5rem 1rem 1rem;
}

.job-entry__head {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.job-entry__summary {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-top: 0.4rem;
}

.errors {
  margin-top: 0.75rem;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  max-height: 260px;
  overflow: auto;
}
</style>
