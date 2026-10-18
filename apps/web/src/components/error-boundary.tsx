import React from "react";
import { ErrorState } from "./error-state.js";

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  message: string | null;
}

/**
 * Catches render errors from the routed page so a crashing feature does not take
 * the whole shell down; the sidebar and header stay usable.
 */
export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { message: null };

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return {
      message:
        error instanceof Error && error.message
          ? error.message
          : "An unexpected error interrupted this page.",
    };
  }

  render(): React.ReactNode {
    if (this.state.message !== null) {
      return (
        <ErrorState
          title="This page failed to load"
          message={this.state.message}
          onRetry={() => this.setState({ message: null })}
        />
      );
    }

    return this.props.children;
  }
}
