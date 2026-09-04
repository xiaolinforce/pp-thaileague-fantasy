import * as Sentry from "@sentry/nextjs";
import {
  prepareBrowserSentryEvent,
  scrubSentryBreadcrumb,
  scrubSentryEvent,
  scrubSentryLog,
} from "@/lib/observability/sentry";

const environment = process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ?? "development";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
  environment,
  enableLogs: true,
  beforeSend: (event) => prepareBrowserSentryEvent(event, navigator.userAgent),
  beforeBreadcrumb: scrubSentryBreadcrumb,
  beforeSendTransaction: scrubSentryEvent,
  beforeSendLog: scrubSentryLog,
  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      maskAllInputs: true,
      blockAllMedia: true,
      networkCaptureBodies: false,
    }),
  ],
  tracesSampleRate: environment === "production" ? 0.05 : 0.1,
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 1.0,
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

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
