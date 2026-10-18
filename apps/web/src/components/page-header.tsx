import React from "react";

export interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  eyebrow?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  actions,
  eyebrow,
}) => {
  return (
    <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-line">
      <div className="min-w-0">
        {eyebrow && (
          <div className="mb-1 text-xs font-medium text-ink-dim">{eyebrow}</div>
        )}
        <h1 className="text-2xl font-bold tracking-tight text-ink">{title}</h1>
        {description && (
          <p className="text-sm text-ink-muted mt-1 max-w-2xl">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 shrink-0">{actions}</div>
      )}
    </header>
  );
};
