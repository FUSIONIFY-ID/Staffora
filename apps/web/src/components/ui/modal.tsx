import React, { useEffect } from "react";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  }[size];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-scrim backdrop-blur-sm animate-fadeIn">
      <div
        className={`w-full ${sizeClasses} max-h-[90vh] flex flex-col rounded-2xl border border-line bg-surface-white p-4 sm:p-6 shadow-lg transition-all`}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex shrink-0 items-center justify-between pb-3 sm:pb-4 border-b border-line">
          <h3 className="text-base sm:text-lg font-bold text-ink">{title}</h3>
          <button
            onClick={onClose}
            className="text-ink-dim hover:text-ink transition-colors p-1 rounded-lg hover:bg-surface-chip"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="mt-4 overflow-y-auto pr-1 flex-1">{children}</div>
      </div>
    </div>
  );
};
