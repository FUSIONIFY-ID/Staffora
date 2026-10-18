import React from "react";
import { PageHeader } from "../../components/page-header.js";
import { EmptyState } from "../../components/empty-state.js";
import { Badge } from "../../components/ui/badge.js";

export const ResourcesPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Resources (Workforce)"
        description="Direktori karyawan, profil skill, departemen, dan ketersediaan kerja."
        actions={<Badge variant="amber">Ready for Sprint 1</Badge>}
      />

      <EmptyState
        icon="R"
        title="Resources Foundation Scaffold"
        description="Halaman ini siap diimplementasikan untuk daftar karyawan, pencarian resource, dan filter skill."
      />
    </div>
  );
};
