import React from "react";

export interface BadgeProps {
  children: React.ReactNode;
  variant?: "blue" | "green" | "amber" | "red" | "purple" | "gray";
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "blue",
  className = "",
}) => {
  const variantStyles = {
    blue: "bg-info-surface text-info-text border-info-border",
    green: "bg-success-surface text-success-text border-success-border",
    amber: "bg-warning-surface text-warning-text border-warning-border",
    red: "bg-danger-surface text-danger-text border-danger-border",
    purple: "bg-violet-surface text-violet-text border-violet-border",
    gray: "bg-surface-chip text-ink-muted border-line",
  }[variant];

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${variantStyles} ${className}`}
    >
      {children}
    </span>
  );
};
