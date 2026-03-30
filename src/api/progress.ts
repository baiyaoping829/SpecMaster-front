import request from '../utils/request'

export type TaskProgress = {
  taskId: string
  status: string
  stage: string
  current: number
  total: number
  percent: number
  startTime: string | null
  eta: number | null
  traceId: string
  lastError?: string | null
  reports?: { files: string[]; zip: string; links: string[] }
}

export const progressApi = {
  get(taskId: string) {
    return request({
      url: `/progress/${encodeURIComponent(taskId)}`,
      method: 'get',
      silent: true
    } as any)
  }
}
