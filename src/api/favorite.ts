import request from '../utils/request'

export type FavoriteSiteVO = {
  id: string
  user_id: string
  site_url: string
  site_name: string
  tags: string[]
  created_at: string
  updated_at: string
}

export type FavoriteListVO = {
  items: FavoriteSiteVO[]
  total: number
  page: number
  size: number
}

export const favoriteApi = {
  create(payload: { site_url: string; site_name?: string; tags?: string[] }) {
    return request({
      url: '/favorite',
      method: 'post',
      data: payload
    })
  },
  list(params: { page?: number; size?: number; q?: string; tag?: string }) {
    return request({
      url: '/favorite',
      method: 'get',
      params
    })
  },
  lookup(site_url: string) {
    return request({
      url: '/favorite/lookup',
      method: 'get',
      params: { site_url },
      silent: true
    } as any)
  },
  update(id: string, payload: { site_name?: string; tags?: string[] }) {
    return request({
      url: `/favorite/${encodeURIComponent(id)}`,
      method: 'put',
      data: payload
    })
  },
  remove(id: string) {
    return request({
      url: `/favorite/${encodeURIComponent(id)}`,
      method: 'delete'
    })
  }
}

