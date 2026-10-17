import React from "react";
import { Link, useNavigate, useParams } from "react-router";
import { PageHeader } from "../../components/page-header.js";
import { EmptyState } from "../../components/empty-state.js";
import { Badge } from "../../components/ui/badge.js";
import { Button } from "../../components/ui/button.js";

export const ResourceDetailPage: React.FC = () => {
  const { employeeId } = useParams<{ employeeId: string }>();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={
          <Link to="/resources" className="text-primary hover:underline">
            &larr; Kembali ke Direktori Resources
          </Link>
        }
        title={`Resource Detail: ${employeeId ?? ""}`}
        description="Profil individual karyawan, skill rating, dan timeline alokasi proyek."
        actions={<Badge variant="amber">Ready for Sprint 1</Badge>}
      />

      <EmptyState
        icon="RD"
        title="Resource Detail Foundation Scaffold"
        description="Halaman ini siap diimplementasikan untuk profil individual karyawan dan riwayat penugasan."
        action={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate("/resources")}
          >
            Kembali
          </Button>
        }
      />
    </div>
  );
};
