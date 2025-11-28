/**
 * Configuration Sentry pour le monitoring d'erreurs en production
 */

// Sentry sera chargé dynamiquement seulement en production
let Sentry: any = null;

export const initSentry = async () => {
  // Ne charger Sentry qu'en production
  if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
    try {
      const SentryModule = await import("@sentry/react");
      Sentry = SentryModule;

      Sentry.init({
        dsn: import.meta.env.VITE_SENTRY_DSN,
        environment: import.meta.env.MODE,
        integrations: [
          Sentry.browserTracingIntegration(),
          Sentry.replayIntegration({
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
};

export const captureException = (error: Error, context?: Record<string, any>) => {
  if (Sentry) {
    Sentry.captureException(error, {
      extra: context,
    });
  } else {
    // Fallback: logger l'erreur en développement
    console.error("Error:", error, context);
  }
};

export const captureMessage = (message: string, level: "info" | "warning" | "error" = "info") => {
  if (Sentry) {
    Sentry.captureMessage(message, level);
  } else {
    console.log(`[${level.toUpperCase()}]`, message);
  }
};

export const setUser = (user: { id: string; email?: string; [key: string]: any }) => {
  if (Sentry) {
    Sentry.setUser(user);
  }
};

export const clearUser = () => {
  if (Sentry) {
    Sentry.setUser(null);
  }
};

export const addBreadcrumb = (message: string, category: string, data?: Record<string, any>) => {
  if (Sentry) {
    Sentry.addBreadcrumb({
      message,
      category,
      data,
      level: "info",
    });
  }
};

