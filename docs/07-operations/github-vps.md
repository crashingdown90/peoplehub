# Pengaturan GitHub & VPS PeopleHub

## GitHub
- Inisialisasi: `git init`, `.gitignore` untuk Next.js/Node (node_modules, .next, .env, dist, coverage).
- Remote: buat repo GitHub, set `origin`, gunakan SSH key atau token.
- Branch: gunakan `main` + feature branches; PR review sebelum merge.
- Secrets: jangan commit `.env`; gunakan `.env.example`; simpan token/secret di GitHub Secrets bila perlu CI.
- CI dasar (GitHub Actions): lint/test/build Next.js; jalankan migrasi DB kering (dry-run) bila memungkinkan.

## Deploy ke VPS
- OS: Ubuntu/Debian minimal; user non-root + sudo; firewall (allow 80/443/SSH).
- Runtime: Node LTS; install PM2 atau gunakan Docker/Compose (opsional).
- Clone: `git clone` repo; salin `.env` dari sumber aman; jalankan `npm install`, `npm run build`.
- DB: gunakan Postgres terpisah; set `DATABASE_URL` di `.env`; jalankan migrasi sebelum start.
- Start: `pm2 start npm --name peoplehub -- run start` (atau `pm2 start npm --name peoplehub -- run dev` untuk staging) atau `docker-compose up -d` jika memakai container.
- Reverse proxy: nginx sebagai SSL terminator; arahkan ke port Next.js; pasang certbot untuk HTTPS.
- Storage: konfigurasi S3-compatible (env) untuk dokumen/slip/foto; pastikan kredensial tidak di-commit.
- Backup & Log: aktifkan log rotation (nginx/app), backup DB terjadwal, uji restore.
- Monitoring: health check endpoint; pantau CPU/mem/disk; alert bila service down.

## Checklist Deploy
- [ ] `.env` lengkap (DB, storage, auth, email).
- [ ] DB migrasi dijalankan.
- [ ] Build berhasil.
- [ ] PM2/process manager berjalan dengan restart policy.
- [ ] Nginx reverse proxy + SSL aktif.
- [ ] Backup DB terjadwal dan diuji.
- [ ] Firewall terbatas (80/443/SSH saja).
