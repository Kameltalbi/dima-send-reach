/**
 * Configuration Sentry pour le monitoring d'erreurs en production
 */

import * as SentryModule from "@sentry/react";

// Ne charger Sentry qu'en production si le DSN est configuré
if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
  try {
    SentryModule.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      environment: import.meta.env.MODE,
      integrations: [
        SentryModule.browserTracingIntegration(),
        SentryModule.replayIntegration({
          maskAllText: true,
          blockAllMedia: true,
        }),
      ],
      // Performance Monitoring
      tracesSampleRate: 1.0, // 100% en production pour commencer, réduire à 0.1 après
      // Session Replay
      replaysSessionSampleRate: 0.1, // 10% des sessions
      replaysOnErrorSampleRate: 1.0, // 100% des sessions avec erreurs
    });

    console.log("Sentry initialized");
  } catch (error) {
    console.error("Failed to initialize Sentry:", error);
  }
}

export const initSentry = () => {
  // Sentry est déjà initialisé si nécessaire
  // Cette fonction existe pour compatibilité mais ne fait rien
};

export const captureException = (error: Error, context?: Record<string, any>) => {
  if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
    SentryModule.captureException(error, {
      extra: context,
    });
  } else {
    // Fallback: logger l'erreur en développement
    console.error("Error:", error, context);
  }
};

export const captureMessage = (message: string, level: "info" | "warning" | "error" = "info") => {
  if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
    SentryModule.captureMessage(message, level);
  } else {
    console.log(`[${level.toUpperCase()}]`, message);
  }
};

export const setUser = (user: { id: string; email?: string; [key: string]: any }) => {
  if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
    SentryModule.setUser(user);
  }
};

export const clearUser = () => {
  if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
    SentryModule.setUser(null);
  }
};

export const addBreadcrumb = (message: string, category: string, data?: Record<string, any>) => {
  if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
    SentryModule.addBreadcrumb({
      message,
      category,
      data,
      level: "info",
    });
  }
};

