import * as client from 'prom-client'

export const createMetrics = () => {
  const register = new client.Registry()
  client.collectDefaultMetrics({ register })

  const httpRequestsTotal = new client.Counter({
    name: 'http_requests_total',
    help: 'HTTP requests total',
    labelNames: ['method', 'route', 'status']
  })

  const httpRequestDurationMs = new client.Histogram({
    name: 'http_request_duration_ms',
    help: 'HTTP request duration in ms',
    labelNames: ['method', 'route', 'status'],
    buckets: [5, 10, 25, 50, 100, 200, 400, 800, 1200, 2000, 5000]
  })

  register.registerMetric(httpRequestsTotal)
  register.registerMetric(httpRequestDurationMs)

  return { register, httpRequestsTotal, httpRequestDurationMs }
}

