import * as Sentry from "@sentry/nextjs";
import {
  scrubSentryBreadcrumb,
  scrubSentryEvent,
  scrubSentryLog,
} from "@/lib/observability/sentry";

const environment =
  process.env.VERCEL_ENV ??
  process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ??
  (process.env.NODE_ENV === "development" ? "development" : "production");

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
  environment,
  enableLogs: true,
  beforeSend: scrubSentryEvent,
  beforeBreadcrumb: scrubSentryBreadcrumb,
  beforeSendTransaction: scrubSentryEvent,
  beforeSendLog: scrubSentryLog,
  includeServerName: false,
  tracesSampleRate: environment === "production" ? 0.05 : 0.1,
  dataCollection: {
    userInfo: false,
    cookies: false,
    httpHeaders: { request: false, response: false },
    httpBodies: [],
    urlQueryParams: false,
    graphQL: { document: false, variables: false },
    genAI: { inputs: false, outputs: false },
    databaseQueryData: false,
    stackFrameVariables: false,
  },
});
