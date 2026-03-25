import { NodeSDK } from '@opentelemetry/sdk-node'
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'

export const startOtel = async () => {
  const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || ''
  const exporter = endpoint ? new OTLPTraceExporter({ url: endpoint }) : null

  const sdk = new NodeSDK({
    serviceName: process.env.OTEL_SERVICE_NAME || 'specmaster',
    traceExporter: exporter || undefined,
    instrumentations: [getNodeAutoInstrumentations()]
  })

  await sdk.start()
  return {
    stop: async () => {
      await sdk.shutdown()
    }
  }
}

