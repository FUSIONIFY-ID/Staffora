import React from 'react'
import { useParams, Link } from 'react-router'
import { Card } from '../../components/ui/card.js'
import { Badge } from '../../components/ui/badge.js'
import { Button } from '../../components/ui/button.js'

export const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E5E7EB]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link to="/projects" className="text-xs text-blue-600 hover:underline">
              &larr; Kembali ke Daftar Proyek
            </Link>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#171717]">Project Detail: {id}</h1>
          <p className="text-sm text-[#525252] mt-1">
            Rincian proyek, kebutuhan staffing peran, dan penugasan karyawan.
          </p>
        </div>
        <Badge variant="amber">
          Ready for Sprint 1
        </Badge>
      </div>

      <Card className="p-8 text-center border-dashed border-[#E5E7EB] bg-[#FAFAFA]">
        <div className="max-w-md mx-auto space-y-3">
          <div className="w-12 h-12 rounded-xl bg-[#EFF6FF] text-[#1D4ED8] flex items-center justify-center mx-auto text-xl font-semibold">
            PD
          </div>
          <h3 className="text-lg font-semibold text-[#171717]">Project Detail Foundation Scaffold</h3>
          <p className="text-sm text-[#525252]">
            Halaman ini siap diimplementasikan untuk detail kebutuhan staffing dan alokasi tim.
          </p>
          <div className="pt-2">
            <Link to="/projects">
              <Button variant="secondary" size="sm">Kembali</Button>
            </Link>
          </div>
        </div>
      </Card>
    </div>
  )
}
