# PeopleHub - Development Guide

## 🚀 Quick Start

### Install Dependencies
```bash
cd peoplehub-app
make install
# atau
./sync-deps.sh
```

### Development Workflow

#### Perubahan Code (src/, public/, dll)
✅ **Otomatis ter-reload** - Tidak perlu restart!
- Next.js hot reload akan detect perubahan
- Refresh browser untuk lihat changes

#### Menambah/Update Dependencies (package.json)
```bash
# Opsi 1: Menggunakan Makefile
make install

# Opsi 2: Menggunakan script
./sync-deps.sh

# Opsi 3: Manual
npm install
docker exec peoplehub-app-dev npm install
```

#### Perubahan Database Schema (prisma/schema.prisma)
```bash
# Push schema changes
docker exec peoplehub-app-dev npx prisma db push

# Generate Prisma client
docker exec peoplehub-app-dev npx prisma generate

# Restart container (only needed for schema changes)
docker restart peoplehub-app-dev
```

### Useful Commands

```bash
# Show available commands
make help

# View logs
make logs

# Restart container
make restart

# Open shell in container
make shell

# Stop all containers
make stop
```

## 📝 Important Notes

### Volume Strategy
Container menggunakan **named volumes** untuk `node_modules` dan `.next`:
- ✅ Fast performance
- ✅ Isolated from host
- ⚠️ Requires sync when dependencies change

### Git Workflow
```bash
# Pull latest changes
cd /var/www/peoplehub
git pull origin main

# If package.json changed
make install

# Commit your changes
git add .
git commit -m "Your message

Co-Authored-By: Warp <agent@warp.dev>"
git push origin main
```

## 🐛 Troubleshooting

### Module not found error
```bash
make install
make restart
```

### Database connection issues
```bash
docker-compose restart db
```

### Clear cache and rebuild
```bash
docker exec peoplehub-app-dev rm -rf .next
make restart
```

## 🔥 Hot Reload

Hot reload **sudah berjalan** untuk:
- ✅ Component changes (src/components/)
- ✅ Page changes (src/app/)
- ✅ API routes (src/app/api/)
- ✅ Styles (CSS, Tailwind)
- ✅ Environment variables (.env) - needs restart

Tidak perlu restart untuk perubahan code!

## ⚡ Performance Optimization

### Turbopack vs Webpack

**Turbopack** (Default - FAST ⚡):
- 10x lebih cepat untuk development
- Hot reload lebih responsive
- Compile time: ~100-500ms (vs 2-12s)

**Webpack** (Fallback):
```bash
npm run dev:webpack
```

### Performance Tips

1. **Use Turbopack** - Sudah default
2. **Component Code Splitting** - Import dynamic
3. **Optimize Images** - Use Next.js Image component
4. **Lazy Loading** - Load components on demand

### Monitoring Performance

```bash
# Watch compile times in logs
make logs | grep "compile:"

# Check build bundle size
npm run build
```

### Common Performance Issues

**Slow first load:**
- Normal untuk first compile (1-3s)
- Subsequent loads: <500ms

**Slow page navigation:**
- Check if using Turbopack: `docker logs peoplehub-app-dev | grep Turbopack`
- Clear cache: `docker exec peoplehub-app-dev rm -rf .next && make restart`

**Module not found:**
- Run `make install` to sync dependencies
