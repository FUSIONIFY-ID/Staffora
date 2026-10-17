import React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = "",
  ...props
}) => {
  return (
    <div
      className={`rounded-[10px] border border-line bg-surface-white p-6 transition-all hover:border-info-border ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
