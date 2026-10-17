import React from 'react'
import { PageHeader } from '../../components/page-header.js'
import { EmptyState } from '../../components/empty-state.js'
import { Badge } from '../../components/ui/badge.js'

export const ProjectsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects"
        description="Daftar proyek, kebutuhan staffing, dan pengelolaan alokasi resource."
        actions={<Badge variant="amber">Ready for Sprint 1</Badge>}
      />

      <EmptyState
        icon="P"
        title="Projects Foundation Scaffold"
        description="Halaman ini siap diimplementasikan oleh tim Frontend (Wahyu & Nabil) dan Backend (Saiful & Jundy) pada Sprint 1 sesuai US03 (Project Management) & PRD/TSD."
      />
    </div>
  )
}
