import React from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { PageHeader } from '../../components/page-header.js'
import { EmptyState } from '../../components/empty-state.js'
import { Badge } from '../../components/ui/badge.js'
import { Button } from '../../components/ui/button.js'

export const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={
          <Link to="/projects" className="text-primary hover:underline">
            &larr; Kembali ke Daftar Proyek
          </Link>
        }
        title={`Project Detail: ${id ?? ''}`}
        description="Rincian proyek, kebutuhan staffing peran, dan penugasan karyawan."
        actions={<Badge variant="amber">Ready for Sprint 1</Badge>}
      />

      <EmptyState
        icon="PD"
        title="Project Detail Foundation Scaffold"
        description="Halaman ini siap diimplementasikan untuk detail kebutuhan staffing dan alokasi tim."
        action={
          <Button variant="secondary" size="sm" onClick={() => navigate('/projects')}>
            Kembali
          </Button>
        }
      />
    </div>
  )
}
