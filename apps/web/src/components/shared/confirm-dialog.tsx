import React from 'react'
import { Modal } from '../ui/modal.js'
import { Button } from '../ui/button.js'

export interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  description: React.ReactNode
  onConfirm: () => void
  onCancel: () => void
  confirmLabel?: string
  cancelLabel?: string
  /** `danger` for destructive actions such as cancelling an allocation. */
  variant?: 'primary' | 'danger'
  /** Shows a spinner on the confirm button and blocks both actions while a mutation is pending. */
  isLoading?: boolean
  /** Optional extra content, e.g. a reason field or an inline error from the API. */
  children?: React.ReactNode
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  description,
  onConfirm,
  onCancel,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'primary',
  isLoading = false,
  children,
}) => {
  const handleClose = (): void => {
    if (!isLoading) onCancel()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title} size="sm">
      <div className="space-y-4">
        <div className="text-sm leading-relaxed text-slate-300">{description}</div>
        {children}
        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button type="button" variant={variant} onClick={onConfirm} isLoading={isLoading}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
