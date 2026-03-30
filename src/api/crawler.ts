import request from '../utils/request'

export type CrawlTaskVO = {
  id: string
  keyword: string
  target_url: string
  batch_id: string
  engine: string
  concurrency: number
  status: string
  max_items: number
  max_depth: number
  success_count: number
  fail_count: number
  last_error?: string | null
  log_path?: string | null
  started_at?: string | null
  finished_at?: string | null
  created_at: string
  updated_at: string
}

export type CrawlTaskListVO = {
  items: CrawlTaskVO[]
  total: number
  page: number
  size: number
}

export type CrawledReportVO = {
  id: string
  task_id?: string | null
  fingerprint: string
  title: string
  report_no: string
  occurred_at: string
  location: string
  accident_type: string
  casualties: string
  cause_overview: string
  responsible_party: string
  overview: string
  report_url: string
  source_url: string
  published_at: string
  raw_path?: string | null
  raw_mime?: string | null
  parsed_json: string
  created_at: string
  updated_at: string
}

export type CrawledReportListVO = {
  items: CrawledReportVO[]
  total: number
  page: number
  size: number
}

export const crawlerApi = {
  createTask(payload: { keyword: string; target_url: string; max_items?: number; max_depth?: number; engine?: string; concurrency?: number }) {
    return request({
      url: '/v1/crawler/tasks',
      method: 'post',
      data: payload
    })
  },
  listTasks(params: { page?: number; size?: number; q?: string; status?: string; start_time?: string; end_time?: string }) {
    return request({
      url: '/v1/crawler/tasks',
      method: 'get',
      params
    })
  },
  runTask(id: string) {
    return request({
      url: `/v1/crawler/tasks/${encodeURIComponent(id)}/run`,
      method: 'post'
    })
  },
  getTaskLog(id: string, params: { tail?: number } = {}) {
    return request({
      url: `/v1/crawler/tasks/${encodeURIComponent(id)}/log`,
      method: 'get',
      params
    })
  },
  listTaskReports(id: string) {
    return request({
      url: `/v1/crawler/tasks/${encodeURIComponent(id)}/reports`,
      method: 'get'
    })
  },
  reportZipUrl(id: string) {
    return `/api/v1/crawler/tasks/${encodeURIComponent(id)}/reports.zip`
  },
  listReports(params: {
    q?: string
    accident_type?: string
    start_date?: string
    end_date?: string
    casualties_level?: string
    sort_by?: string
    sort_order?: string
    page?: number
    size?: number
  }) {
    return request({
      url: '/v1/crawler/reports',
      method: 'get',
      params
    })
  },
  deleteReport(id: string) {
    return request({
      url: `/v1/crawler/reports/${encodeURIComponent(id)}`,
      method: 'delete'
    })
  },
  reparseReport(id: string) {
    return request({
      url: `/v1/crawler/reports/${encodeURIComponent(id)}/reparse`,
      method: 'post'
    })
  }
}
