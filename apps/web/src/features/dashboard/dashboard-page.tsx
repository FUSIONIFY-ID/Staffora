import React from 'react'
import { useAuth } from '../../app/providers/auth-provider.js'
import { Card } from '../../components/ui/card.js'
import { Badge } from '../../components/ui/badge.js'
import { PageHeader } from '../../components/page-header.js'
import { EmptyState } from '../../components/empty-state.js'

const ROLE_DESCRIPTION: Readonly<Record<string, string>> = {
  ADMIN: 'Kelola pengguna, peran, dan master data sistem.',
  PROJECT_MANAGER: 'Kelola proyek, kebutuhan staf, dan alokasi tim Anda.',
  RESOURCE_MANAGER: 'Kelola kapasitas, keterampilan, dan alokasi seluruh workforce.',
  EMPLOYEE: 'Lihat profil, keterampilan, dan alokasi Anda.',
}

/**
 * Dashboard landing page for the shell.
 *
 * This card only owns the shell, so the page shows who is signed in and what
 * their role can reach. An earlier revision rendered "PostgreSQL 18" with a
 * pulsing green dot, "HttpOnly Cookie · Active", and a sprint status, none of
 * which came from the backend. Presenting invented live status as real is what
 * the review checklist forbids, so those cards are gone. Real metrics belong to
 * the dashboard card, which will read them from the API.
 */
export const DashboardPage: React.FC = () => {
  const { user } = useAuth()

  if (!user) {
    return null
  }

  const displayName = user.employee?.fullName ?? user.email

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Selamat datang, ${displayName}`}
        description={ROLE_DESCRIPTION[user.role] ?? 'Ringkasan workspace Staffora Anda.'}
        actions={<Badge variant="purple">{user.role.replace('_', ' ')}</Badge>}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5">
          <span className="text-xs font-medium text-ink-dim uppercase tracking-wider">Peran Pengguna</span>
          <div className="mt-2">
            <span className="text-xl font-semibold text-ink">{user.role.replace('_', ' ')}</span>
          </div>
        </Card>

        <Card className="p-5">
          <span className="text-xs font-medium text-ink-dim uppercase tracking-wider">Nama</span>
          <div className="mt-2">
            <span className="text-xl font-semibold text-ink truncate">{displayName}</span>
          </div>
        </Card>

        <Card className="p-5">
          <span className="text-xs font-medium text-ink-dim uppercase tracking-wider">Email</span>
          <div className="mt-2">
            <span className="text-base font-semibold text-ink truncate">{user.email}</span>
          </div>
        </Card>

        <Card className="p-5">
          <span className="text-xs font-medium text-ink-dim uppercase tracking-wider">Departemen</span>
          <div className="mt-2">
            <span className="text-base font-semibold text-ink truncate">
              {user.employee?.departmentName ?? '—'}
            </span>
          </div>
        </Card>
      </div>

      <EmptyState
        icon="D"
        title="Metrik dashboard belum tersedia"
        description="Kartu ini menyediakan kerangka aplikasi. Metrik kapasitas dan proyek akan tampil di sini setelah endpoint-nya tersedia."
      />
    </div>
  )
}
