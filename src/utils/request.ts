import axios from 'axios'
import { ElMessage } from 'element-plus'
import { useUserStore } from '../store/modules/user'

// 创建 axios 实例
const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    const userStore = useUserStore()
    if (userStore.token) {
      config.headers = config.headers || {}
      config.headers.Authorization = `Bearer ${userStore.token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    const silent = Boolean((response.config as any)?.silent)
    const res = response.data
    if (res && typeof res === 'object' && 'code' in res) {
      if ((res as any).code !== 200) {
        if (!silent) ElMessage.error((res as any).message || '请求失败')
        return Promise.reject(res)
      }
      return res
    }
    return res
  },
  (error) => {
    const silent = Boolean((error as any)?.config?.silent)
    if (error.response) {
      const status = error.response.status
      switch (status) {
        case 401:
          if (!silent) ElMessage.error('未授权，请重新登录')
          const userStore = useUserStore()
          userStore.logout()
          break
        case 403:
          if (!silent) ElMessage.error('拒绝访问')
          break
        case 404:
          if (!silent) ElMessage.error('请求地址不存在')
          break
        case 500:
          if (!silent) ElMessage.error('服务器内部错误')
          break
        default:
          if (!silent) ElMessage.error('请求失败')
      }
    } else {
      if (!silent) ElMessage.error('网络错误')
    }
    return Promise.reject(error)
  }
)

export default request
