import request from '../utils/request'

export const strategyApi = {
  recommend(url: string) {
    return request({
      url: '/strategy/recommend',
      method: 'get',
      params: { url }
    })
  },
  smartTask(payload: { keyword: string; target_url: string; max_items?: number; max_depth?: number }) {
    return request({
      url: '/strategy/smart-task',
      method: 'post',
      data: payload
    })
  },
  compareAB(payload: { url: string; strategy: Record<string, any> }) {
    return request({
      url: '/strategy/ab-compare',
      method: 'post',
      data: payload
    })
  },
  saveExperience(payload: { url: string; name: string; description?: string; strategy: Record<string, any> }) {
    return request({
      url: '/strategy/experience',
      method: 'post',
      data: payload
    })
  }
}

