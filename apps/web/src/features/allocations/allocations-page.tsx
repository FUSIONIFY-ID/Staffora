import React from 'react'
import { PageHeader } from '../../components/page-header.js'
import { EmptyState } from '../../components/empty-state.js'
import { Badge } from '../../components/ui/badge.js'

export const AllocationsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Resource Allocations"
        description="Riwayat dan penugasan aktif karyawan pada proyek serta pemenuhan kebutuhan staffing."
        actions={<Badge variant="amber">Ready for Sprint 1</Badge>}
      />

      <EmptyState
        icon="A"
        title="Allocations Foundation Scaffold"
        description="Halaman ini siap diimplementasikan untuk penugasan sumber daya, validasi konflik kapasitas, dan riwayat alokasi."
      />
    </div>
  )
}
