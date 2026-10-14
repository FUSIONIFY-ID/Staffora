import React from 'react'
import { PageHeader } from '../../components/page-header.js'
import { EmptyState } from '../../components/empty-state.js'
import { Badge } from '../../components/ui/badge.js'

export const SkillsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Skills Matrix"
        description="Katalog keahlian perusahaan, kategori skill, dan pemetaan keahlian tim."
        actions={<Badge variant="amber">Ready for Sprint 1</Badge>}
      />

      <EmptyState
        icon="S"
        title="Skills Foundation Scaffold"
        description="Halaman ini siap diimplementasikan untuk katalog keahlian dan tingkat kemahiran (proficiency)."
      />
    </div>
  )
}
