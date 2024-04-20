import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base";
import { AwsInstrumentation } from "@opentelemetry/instrumentation-aws-sdk";

const exporter = new OTLPTraceExporter({
  url: "http://otel-collector:4318/v1/traces",
  concurrencyLimit: 1,
});

console.log("starting otel layer");

const sdk = new NodeSDK({
  spanProcessor: new BatchSpanProcessor(exporter),
  serviceName: "otel",
  instrumentations: [
    getNodeAutoInstrumentations({
      "@opentelemetry/instrumentation-fs": {
        enabled: false,
      },
    }),
    new AwsInstrumentation({
      sqsExtractContextPropagationFromPayload: true,
      suppressInternalInstrumentation: true,
    }),
  ],
});

sdk.start();

process.on("SIGTERM", () => {
  sdk
    .shutdown()
    .then(() => console.log("Tracing terminated"))
    .catch((error: Error) => console.log("Error terminating tracing", error))
    .finally(() => process.exit(0));
});
