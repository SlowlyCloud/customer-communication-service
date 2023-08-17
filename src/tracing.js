const { BatchSpanProcessor } = require('@opentelemetry/sdk-trace-base');
const { HttpInstrumentation } = require('@opentelemetry/instrumentation-http');
const { ExpressInstrumentation } = require('@opentelemetry/instrumentation-express');
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');
//   const { PrometheusExporter } = require('@opentelemetry/exporter-prometheus');
const { NodeSDK } = require('@opentelemetry/sdk-node');
const { AsyncLocalStorageContextManager } = require('@opentelemetry/context-async-hooks');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-proto');
const config = require('./config')

const oltpExporter = new OTLPTraceExporter({
  url: `https://api.honeycomb.io/v1/traces`,
  headers: {
    'x-honeycomb-team': config.otel.honeycomb.apiKey,
  },
})

const otelSDK = new NodeSDK({
  // metricExporter: new PrometheusExporter({
  //   port: 8081,
  // }),
  // metricInterval: 1000,
  spanProcessor: new BatchSpanProcessor(oltpExporter),
  contextManager: new AsyncLocalStorageContextManager(),
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: config.server.id + (config.server.localDebug ? '-local' : ''),
  }),
  instrumentations: [
    new HttpInstrumentation({
      ignoreOutgoingRequestHook: request => {
        let result = false;
        if (request.hostname === 'mainnet.infura.io')
          result = true;
        return result;
      }
    }),
    new ExpressInstrumentation(),
  ],
});

module.exports =  otelSDK;

process.on('SIGTERM', () => {
  otelSDK
    .shutdown()
    .then(
      () => console.log('SDK shut down successfully'),
      err => console.log('Error shutting down SDK', err)
    )
    .finally(() => process.exit(0));
});