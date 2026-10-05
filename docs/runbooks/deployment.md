# Deployment Runbook (TSD Section 16)

Panduan operasional deployment Staffora ke staging dan production.

---

## 1. Deployment Topology (TSD 16.2 & ADR-007)

Staffora dideploy pada **Single Linux VM + Docker Compose** dengan entry point **Nginx Reverse Proxy**:
- `Nginx`: Melayani TLS termination, menyajikan static React build di `/`, me-reverse proxy `/api/v1` ke container Express API, dan menyajikan `/api-docs` (Swagger UI).
- `Express API`: Node.js 24 LTS container.
- `PostgreSQL`: PostgreSQL 18 container (tidak diekspos ke public internet).

---

## 2. Automated Staging Deployment (TSD 16.4)

Setiap merge ke branch `main` akan memicu GitHub Actions:
1. Menjalankan linter, typechecker, test suites, dan disposable migration test.
2. Membangun multi-arch Docker images dan mem-push ke GitHub Container Registry (`ghcr.io`).
3. Deploy otomatis ke staging VM.
4. Menjalankan `prisma migrate deploy`.
5. Melakukan health check `/api/v1/health/live` dan `/api/v1/health/ready`.

---

## 3. Production Deployment Procedure

Production deployment dipicu oleh **Semantic Version Tag** (contoh: `v1.0.0`) dan membutuhkan **Manual Approval** di GitHub Environment:

1. **Pre-flight & Backup**:
   Jalankan logical backup database PostgreSQL:
   ```bash
   pg_dump -U staffora -h localhost staffora > backup_$(date +%Y%m%d_%H%M%S).sql
   ```
2. **Execute Deployment**:
   ```bash
   # Pull versi image terbaru
   docker compose -f docker-compose.prod.yml pull

   # Jalankan database migrations
   docker compose -f docker-compose.prod.yml run --rm api npx prisma migrate deploy

   # Zero-downtime rolling restart
   docker compose -f docker-compose.prod.yml up -d --remove-orphans
   ```
3. **Post-Deployment Verification (Smoke Test)**:
   - Verifikasi endpoint `/api/v1/health/live` mengembalikan `{ "status": "UP" }`.
   - Verifikasi endpoint `/api/v1/health/ready` mengembalikan database connection ready.
   - Buka browser dan pastikan login page dan dashboard dapat diakses.
