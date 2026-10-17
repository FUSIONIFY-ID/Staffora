import React from 'react'
import { useParams, Link } from 'react-router'
import { Card } from '../../components/ui/card.js'
import { Badge } from '../../components/ui/badge.js'
import { Button } from '../../components/ui/button.js'

export const ResourceDetailPage: React.FC = () => {
  const { employeeId } = useParams<{ employeeId: string }>()

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link to="/resources" className="text-xs text-indigo-400 hover:underline">
              &larr; Kembali ke Direktori Resources
            </Link>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Resource Detail: {employeeId}</h1>
          <p className="text-sm text-slate-400 mt-1">
            Profil individual karyawan, skill rating, dan timeline alokasi proyek.
          </p>
        </div>
        <Badge variant="amber">
          Ready for Sprint 1
        </Badge>
      </div>

      <Card className="p-8 text-center border-dashed border-slate-800 bg-slate-900/30">
        <div className="max-w-md mx-auto space-y-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto text-xl font-semibold">
            RD
          </div>
          <h3 className="text-lg font-semibold text-white">Resource Detail Foundation Scaffold</h3>
          <p className="text-sm text-slate-400">
            Halaman ini siap diimplementasikan untuk profil individual karyawan dan riwayat penugasan.
          </p>
          <div className="pt-2">
            <Link to="/resources">
              <Button variant="secondary" size="sm">Kembali</Button>
            </Link>
          </div>
        </div>
      </Card>
    </div>
  )
}
