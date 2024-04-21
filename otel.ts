import { HttpInstrumentation } from "@opentelemetry/instrumentation-http";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base";
import { AwsInstrumentation } from "@opentelemetry/instrumentation-aws-sdk";
import {
  ExpressLayerType,
  ExpressInstrumentation,
} from "@opentelemetry/instrumentation-express";
import { Resource } from "@opentelemetry/resources";
const {
  SemanticResourceAttributes,
} = require("@opentelemetry/semantic-conventions");

const exporter = new OTLPTraceExporter({
  url: "http://otel-collector:4318/v1/traces",
  concurrencyLimit: 1,
});

console.log("starting otel layer");

const resource = Resource.default().merge(
  new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: "otel",
    [SemanticResourceAttributes.SERVICE_VERSION]: "0.1.0",
  })
);

const sdk = new NodeSDK({
  resource: resource,
  spanProcessor: new BatchSpanProcessor(exporter),
  serviceName: "otel",
  instrumentations: [
    new HttpInstrumentation(),
    new ExpressInstrumentation({
      ignoreLayersType: [ExpressLayerType.MIDDLEWARE],
    }),
    new AwsInstrumentation({
      sqsExtractContextPropagationFromPayload: true,
      suppressInternalInstrumentation: true,
      // sqsProcessHook: (span: Span, { message }) => {
      //   const traceparent = message.MessageAttributes?.traceparent.StringValue;
      //   if (traceparent) {
      //     const spanContext = parseTraceParent(traceparent);
      //     span.setAttribute("parentTraceId", spanContext?.traceId || "");
      //   }
      // },
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
