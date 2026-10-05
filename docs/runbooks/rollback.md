# Rollback Runbook (TSD Section 16.6)

Prosedur mitigasi dan pengembalian aplikasi ke versi sebelumnya jika deployment mengalami kegagalan.

---

## 1. Fast Application Rollback

Jika bug kritis ditemukan pasca-deployment tanpa perubahan skema database yang destruktif:

1. **Revert ke Image Tag Sebelumnya**:
   Ubah tag image pada environment file VM ke versi stabil sebelumnya:
   ```bash
   export STAFFORA_VERSION=v1.x.previous
   docker compose -f docker-compose.prod.yml up -d
   ```
2. **Verifikasi Rollback**:
   ```bash
   curl -f http://localhost:3000/api/v1/health/ready
   ```

---

## 2. Database Migration Rollback Rules

Sesuai **TSD 12.3 & 16.6**:
- Seluruh migrasi database produksi wajib **bersifat aditif / backward-compatible** dalam satu siklus rilis sehingga application rollback ke image sebelumnya tetap berjalan normal tanpa harus me-rollback database.
- Jika migrasi gagal di tengah jalan saat proses deployment, pipeline deployment otomatis berhenti sebelum container aplikasi diperbarui.
- Jika data korup atau migrasi kritis gagal total:
  ```bash
  # Restore dari snapshot backup sebelum rilis
  psql -U staffora -h localhost -d staffora < backup_pre_release.sql
  ```
