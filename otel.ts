import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base";
import { AwsInstrumentation } from "@opentelemetry/instrumentation-aws-sdk";
import { trace, Span, context } from "@opentelemetry/api";
import { parseTraceParent } from "@opentelemetry/core";

const exporter = new OTLPTraceExporter({
  url: "http://otel-collector:4318/v1/traces",
  concurrencyLimit: 1,
});

console.log("starting otel layer");

const sdk = new NodeSDK({
  spanProcessor: new BatchSpanProcessor(exporter),
  serviceName: "otel",
  instrumentations: [
    new AwsInstrumentation({
      sqsExtractContextPropagationFromPayload: true,
      suppressInternalInstrumentation: true,
      sqsProcessHook: (span: Span, { message }) => {
        const traceparent = message.MessageAttributes?.traceparent.StringValue;
        if (traceparent) {
          const spanContext = parseTraceParent(traceparent);
          span.setAttribute("parentTraceId", spanContext?.traceId || "");
        }
      },
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
