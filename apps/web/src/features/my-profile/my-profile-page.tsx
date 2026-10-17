import React from 'react'
import { useAuth } from '../../app/providers/auth-provider.js'
import { PageHeader } from '../../components/page-header.js'
import { EmptyState } from '../../components/empty-state.js'
import { Badge } from '../../components/ui/badge.js'

export const MyProfilePage: React.FC = () => {
  const { user } = useAuth()

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Profile"
        description="Informasi profil personal, keahlian, dan jadwal alokasi proyek aktif."
        actions={<Badge variant="amber">Ready for Sprint 1</Badge>}
      />

      <EmptyState
        icon={user?.employee?.fullName?.charAt(0) ?? 'U'}
        title={user?.employee?.fullName ?? user?.email ?? 'My Profile'}
        description="Halaman ini siap diimplementasikan untuk self-service profil karyawan (keahlian & jadwal proyek)."
      />
    </div>
  )
}
