import React from 'react'
import { Spinner } from './ui/spinner.js'

export interface LoadingStateProps {
  message?: string
  fullHeight?: boolean
}

export const LoadingState: React.FC<LoadingStateProps> = ({ message, fullHeight = false }) => {
  return (
    <div
      role="status"
      className={`flex flex-col items-center justify-center gap-3 ${fullHeight ? 'min-h-screen bg-[#F7F8FA]' : 'min-h-[50vh]'}`}
    >
      <Spinner size="lg" />
      {message && <p className="text-sm text-[#525252]">{message}</p>}
    </div>
  )
}
