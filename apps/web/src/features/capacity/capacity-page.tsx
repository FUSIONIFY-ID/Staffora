import React from "react";
import { PageHeader } from "../../components/page-header.js";
import { EmptyState } from "../../components/empty-state.js";
import { Badge } from "../../components/ui/badge.js";

export const CapacityPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Capacity & Workload Timeline"
        description="Visualisasi kapasitas kerja, ketersediaan karyawan, dan deteksi konflik over-allocation."
        actions={<Badge variant="amber">Ready for Sprint 1</Badge>}
      />

      <EmptyState
        icon="C"
        title="Capacity Timeline Foundation Scaffold"
        description="Halaman ini siap diimplementasikan untuk visualisasi heatmap/timeline kapasitas karyawan dan deteksi over-allocation."
      />
    </div>
  );
};
