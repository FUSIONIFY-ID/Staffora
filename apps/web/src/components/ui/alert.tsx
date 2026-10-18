import React from "react";

export interface AlertProps {
  type?: "info" | "success" | "warning" | "error";
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  type = "info",
  title,
  children,
  className = "",
}) => {
  const styles = {
    info: "bg-info-surface border-info-border text-info-text",
    success: "bg-success-surface border-success-border text-success-text",
    warning: "bg-warning-surface border-warning-border text-warning-text",
    error: "bg-danger-surface border-danger-border text-danger-text",
  }[type];

  return (
    <div
      className={`rounded-xl border p-4 text-sm ${styles} ${className}`}
      role="alert"
    >
      {title && <h5 className="font-semibold mb-1">{title}</h5>}
      <div className="opacity-90">{children}</div>
    </div>
  );
};
