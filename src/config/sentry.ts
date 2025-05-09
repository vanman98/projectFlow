// src/config/sentry.ts

import * as Sentry from '@sentry/node';
import { Application } from 'express';
import dotenv from 'dotenv';


dotenv.config(); // Load SENTRY_DSN and other env variables

/**
 * Initialize Sentry for error tracking and performance monitoring.
 * Call this ASAP in your application startup (before other middleware).
 *
 * @param app - Express application instance, used for Express tracing integration.
 */
export function initSentry(app: Application): void {
    Sentry.init({
        dsn: process.env.SENTRY_DSN,              // your DSN
        integrations: [
            // Capture outgoing HTTP calls & breadcrumbs
            Sentry.httpIntegration({ breadcrumbs: true, trackIncomingRequestsAsSessions: true }),  // :contentReference[oaicite:0]{index=0}
            // Auto-instrument Express request/response tracing
            Sentry.expressIntegration(),                                  // :contentReference[oaicite:1]{index=1}
        ],
        tracesSampleRate: 1.0,                    // 100% transaction sampling
        environment: process.env.NODE_ENV || 'development',
        debug: process.env.NODE_ENV !== 'production',
    });
}

// Usage in src/server.ts:
// import { initSentry } from './config/sentry';
//
// // After creating your Express app:
// initSentry(app);
//
// // Then attach handlers:
// app.use(Sentry.Handlers.requestHandler());
// app.use(Sentry.Handlers.tracingHandler());
// ... your routes ...
// app.use(Sentry.Handlers.errorHandler());
