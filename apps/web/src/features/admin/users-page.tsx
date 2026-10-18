import React from "react";
import { PageHeader } from "../../components/page-header.js";
import { EmptyState } from "../../components/empty-state.js";
import { Badge } from "../../components/ui/badge.js";

export const UsersPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        title="System User Management"
        description="Manajemen akun pengguna sistem, penugasan peran (RBAC), dan aktivasi user."
        actions={<Badge variant="amber">Ready for Sprint 1</Badge>}
      />

      <EmptyState
        icon="U"
        title="User Management Foundation Scaffold"
        description="Halaman ini khusus untuk System Admin guna mengelola akun login dan peran pengguna. Siap diimplementasikan pada Sprint mendatang."
      />
    </div>
  );
};
