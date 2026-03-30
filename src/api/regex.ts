import request from '../utils/request'

export const regexApi = {
  preview(payload: { seed_url: string; regex: string; max_preview?: number; timeout_seconds?: number }) {
    return request({
      url: '/regex/preview',
      method: 'post',
      data: payload
    })
  },
  enqueue(payload: { keyword: string; seed_url: string; regex: string; max_urls?: number; max_depth?: number; engine?: string; concurrency?: number }) {
    return request({
      url: '/regex/enqueue',
      method: 'post',
      data: payload
    })
  }
}

