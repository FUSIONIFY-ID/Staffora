import React from "react";
import { Alert } from "./ui/alert.js";
import { Button } from "./ui/button.js";

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = "Something went wrong",
  message,
  onRetry,
}) => {
  return (
    <div className="max-w-xl mx-auto my-12">
      <Alert type="error" title={title}>
        <p className="leading-relaxed">{message}</p>
        {onRetry && (
          <div className="mt-4">
            <Button variant="secondary" size="sm" onClick={onRetry}>
              Try again
            </Button>
          </div>
        )}
      </Alert>
    </div>
  );
};
