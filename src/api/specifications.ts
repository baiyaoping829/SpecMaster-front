import request from '../utils/request'

export type LatestSpecification = {
  id: string
  name: string
  version: number
  uploader: string | null
  uploadTime: string
}

export type LatestResponse = {
  items: LatestSpecification[]
}

export type DeleteResponse = {
  successIds: string[]
  failed: Array<{ id: string; reason: string }>
}

export const specificationsApi = {
  latest(timeoutMs = 3000, silent = true) {
    return request.get('/specifications/latest', { timeout: timeoutMs, silent } as any)
  },
  delete(ids: string[], timeoutMs = 3000, silent = true) {
    return request.delete('/specifications', { data: ids, timeout: timeoutMs, silent } as any)
  }
}

