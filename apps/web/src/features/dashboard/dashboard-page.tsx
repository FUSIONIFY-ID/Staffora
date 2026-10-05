import React from 'react'
import { useAuth } from '../../app/providers/auth-provider.js'
import { Card } from '../../components/ui/card.js'
import { Badge } from '../../components/ui/badge.js'

export const DashboardPage: React.FC = () => {
  const { user } = useAuth()

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Workforce Dashboard</h1>
          <p className="text-sm text-slate-400 mt-1">
            Selamat datang, <span className="text-white font-medium">{user?.employee?.fullName ?? user?.email}</span>. Pondasi sistem Staffora siap untuk pengembangan Sprint 1.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="green">
            Foundation v0.1.0
          </Badge>
          <Badge variant="blue">
            Sprint 1 Ready
          </Badge>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 border-slate-800 bg-slate-900/60">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Peran Pengguna</span>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xl font-bold text-white">{user?.role}</span>
            <Badge variant="purple">{user?.role}</Badge>
          </div>
        </Card>

        <Card className="p-5 border-slate-800 bg-slate-900/60">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Database Status</span>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xl font-bold text-white">PostgreSQL 18</span>
            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
        </Card>

        <Card className="p-5 border-slate-800 bg-slate-900/60">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Session Auth</span>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xl font-bold text-white">HttpOnly Cookie</span>
            <Badge variant="green">Active</Badge>
          </div>
        </Card>

        <Card className="p-5 border-slate-800 bg-slate-900/60">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Sprint Scope</span>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xl font-bold text-white">Sprint 1 Kickoff</span>
            <Badge variant="amber">Pending Dev</Badge>
          </div>
        </Card>
      </div>

      {/* Main Scaffold Card */}
      <Card className="p-8 border-dashed border-slate-800 bg-slate-900/30 text-center">
        <div className="max-w-md mx-auto space-y-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto text-xl font-semibold">
            D
          </div>
          <h3 className="text-lg font-semibold text-white">Dashboard Feature Scaffold</h3>
          <p className="text-sm text-slate-400">
            Modul dashboard metrik kapasitas dan proyek siap dikembangkan oleh tim pada Sprint 1 sesuai dengan spesifikasi PRD & TSD.
          </p>
        </div>
      </Card>
    </div>
  )
}
