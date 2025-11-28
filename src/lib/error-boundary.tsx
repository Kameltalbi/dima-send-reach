import React, { Component, ErrorInfo, ReactNode } from "react";
import { captureException } from "./sentry";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Envoyer l'erreur à Sentry
    captureException(error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-6">
          <div className="max-w-md w-full">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Une erreur s'est produite</AlertTitle>
              <AlertDescription className="mt-4">
                <p className="mb-4">
                  Désolé, une erreur inattendue s'est produite. L'erreur a été
                  enregistrée et nous allons la corriger.
                </p>
                {this.state.error && (
                  <details className="mt-4">
                    <summary className="cursor-pointer text-sm font-medium">
                      Détails de l'erreur
                    </summary>
                    <pre className="mt-2 text-xs overflow-auto bg-muted p-2 rounded">
                      {this.state.error.toString()}
                    </pre>
                  </details>
                )}
                <Button
                  onClick={this.handleReset}
                  className="mt-4"
                  variant="outline"
                >
                  Réessayer
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

