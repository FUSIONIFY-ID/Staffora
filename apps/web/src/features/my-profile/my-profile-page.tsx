import React from 'react'
import { useAuth } from '../../app/providers/auth-provider.js'
import { Card } from '../../components/ui/card.js'
import { Badge } from '../../components/ui/badge.js'

export const MyProfilePage: React.FC = () => {
  const { user } = useAuth()

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">My Profile</h1>
          <p className="text-sm text-slate-400 mt-1">
            Informasi profil personal, keahlian, dan jadwal alokasi proyek aktif.
          </p>
        </div>
        <Badge variant="amber">
          Ready for Sprint 1
        </Badge>
      </div>

      <Card className="p-8 text-center border-dashed border-slate-800 bg-slate-900/30">
        <div className="max-w-md mx-auto space-y-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto text-xl font-semibold">
            {user?.employee?.fullName?.charAt(0) ?? 'U'}
          </div>
          <h3 className="text-lg font-semibold text-white">{user?.employee?.fullName ?? user?.email}</h3>
          <p className="text-sm text-slate-400">
            Halaman ini siap diimplementasikan untuk self-service profil karyawan (keahlian & jadwal proyek).
          </p>
        </div>
      </Card>
    </div>
  )
}
