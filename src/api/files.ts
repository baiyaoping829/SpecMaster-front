import request from '../utils/request'

export const filesApi = {
  presign(fileObjectId: string, timeoutMs = 3000, silent = true) {
    return request.get(`/file/presign/${encodeURIComponent(fileObjectId)}`, { timeout: timeoutMs, silent } as any)
  }
}

