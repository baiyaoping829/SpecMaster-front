import http from 'k6/http'
import { check, sleep } from 'k6'

export const options = {
  vus: 50,
  duration: '30s',
  thresholds: {
    http_req_failed: ['rate==0'],
    http_req_duration: ['p(95)<1200', 'avg<800']
  }
}

const baseUrl = __ENV.BASE_URL || 'http://127.0.0.1:3001'

const login = () => {
  const res = http.post(`${baseUrl}/api/auth/login`, JSON.stringify({ username: 'admin', password: 'admin' }), {
    headers: { 'Content-Type': 'application/json' }
  })
  const ok = check(res, { 'login ok': (r) => r.status === 200 && r.json('code') === 200 })
  if (!ok) return ''
  return res.json('data.token')
}

export default function () {
  const token = login()
  const headers = token ? { Authorization: `Bearer ${token}` } : {}

  const list = http.get(`${baseUrl}/api/spec/list`, { headers })
  check(list, { 'list ok': (r) => r.status === 200 && r.json('code') === 200 })

  const create = http.post(
    `${baseUrl}/api/spec/upload`,
    JSON.stringify({ name: `k6-${Date.now()}`, code: `k6-${__ITER}`, type: 'GB', level: 1, status: 1 }),
    { headers: { ...headers, 'Content-Type': 'application/json' } }
  )
  check(create, { 'create ok': (r) => r.status === 200 && r.json('code') === 200 })

  sleep(1)
}
