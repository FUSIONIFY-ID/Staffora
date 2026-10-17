import React from 'react'
import { Alert } from '../../../components/ui/alert.js'
import { Button } from '../../../components/ui/button.js'
import { ApiError } from '../../../api/client.js'

export interface ResourceErrorAlertProps {
  error: unknown
  onRetry: () => void
}

export const ResourceErrorAlert: React.FC<ResourceErrorAlertProps> = ({
  error,
  onRetry,
}): React.JSX.Element => {
  if (error instanceof ApiError && error.status === 403) {
    return (
      <Alert type="error" title="403 - Akses Ditolak">
        Anda tidak memiliki izin untuk melihat direktori karyawan. Akses dibatasi untuk peran tertentu.
      </Alert>
    )
  }

  const isNetwork =
    error instanceof TypeError ||
    (error as Error)?.message?.toLowerCase().includes('failed to fetch') ||
    (error as Error)?.message?.toLowerCase().includes('network')

  return (
    <Alert
      type="error"
      title={isNetwork ? 'Gangguan Koneksi Jaringan' : 'Gagal Memuat Data Direktori'}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <span>
          {isNetwork
            ? 'Gagal terhubung ke server. Periksa jaringan Anda dan coba lagi.'
            : (error as Error)?.message || 'Terjadi kesalahan pada server saat memuat data karyawan.'}
        </span>
        <Button size="sm" variant="outline" onClick={onRetry}>
          Coba Lagi
        </Button>
      </div>
    </Alert>
  )
}
