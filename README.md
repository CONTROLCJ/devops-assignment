# Production-Ready DevOps Assignment

> **Yapımcı:** Yunus Aykut

Node.js + PostgreSQL uygulaması için production-grade DevOps altyapısı.

## 🏗️ Mimari

```
┌─────────────────────────────────────────────────┐
│  Host Machine                                   │
│                                                 │
│  ┌───────────────────────────────────────────┐  │
│  │  backend network (internal: true)         │  │
│  │                                           │  │
│  │  ┌─────────────┐    ┌─────────────────┐   │  │
│  │  │  app (Node)  │───▶│  db (Postgres)  │   │  │
│  │  │  :3000       │    │  :5432          │   │  │
│  │  │  nonroot     │    │  No port expose │   │  │
│  │  └─────────────┘    └─────────────────┘   │  │
│  │         │                    │             │  │
│  │         ▼                    ▼             │  │
│  │  /run/secrets/        /run/secrets/        │  │
│  │  ├─ db_user           ├─ db_user           │  │
│  │  └─ db_password       └─ db_password       │  │
│  └───────────────────────────────────────────┘  │
│         │                                       │
│    ports: 3000:3000                             │
└─────────────────────────────────────────────────┘
```

## 📁 Dosya Yapısı

```
.
├── .dockerignore               # Build context optimizasyonu
├── .gitignore                  # Secrets'ı repo dışında tutar
├── .github/
│   └── workflows/
│       └── deploy.yml          # CI/CD: OIDC + Trivy + Cosign
├── Dockerfile                  # Multi-stage: deps → builder → runner
├── docker-compose.prod.yml     # Production compose
├── index.js                    # Node.js API (/health endpoint)
├── package.json
├── package-lock.json
├── secrets/                    # ⚠️ .gitignore'da — commit'lenMEZ
│   ├── db_user.txt
│   └── db_password.txt
└── README.md
```

## 🚀 Hızlı Başlangıç

### Ön Koşullar
- Docker Engine 20.10+ (BuildKit destekli)
- Docker Compose v2+

### 1. Secret dosyalarını oluştur

```bash
mkdir -p secrets
echo "prod_user" > secrets/db_user.txt
echo "GüçlüŞifre123!" > secrets/db_password.txt
```

### 2. Uygulamayı başlat

```bash
DOCKER_BUILDKIT=1 docker-compose -f docker-compose.prod.yml up -d --build
```

### 3. Sağlık kontrolü

```bash
curl http://localhost:3000/health
# {"status":"ok","timestamp":"2026-04-27T..."}
```

### 4. Logları izle

```bash
docker-compose -f docker-compose.prod.yml logs -f
```

### 5. Durdur

```bash
docker-compose -f docker-compose.prod.yml down
```

## 🔒 Güvenlik Önlemleri

| Katman | Önlem | Açıklama |
|---|---|---|
| **İmaj** | Distroless + nonroot | Shell yok, root yok |
| **Build** | BuildKit cache + secret mount | Credential sızıntısı engellenir |
| **Secrets** | File-based mount | Env variable'da şifre tutulmaz |
| **Network** | `internal: true` | DB dışarıya tamamen kapalı |
| **CI/CD** | OIDC Federation | Long-lived key kullanılmaz |
| **Tarama** | Trivy (CRITICAL+HIGH) | Her push'ta otomatik zafiyet taraması |
| **Supply Chain** | Cosign keyless signing | İmaj bütünlüğü kriptografik olarak doğrulanabilir |

## ⚙️ CI/CD Pipeline

```
Push to main
    │
    ▼
Checkout → OIDC Auth (AWS) → Buildx → Build Image
    │
    ▼
Trivy Scan (CRITICAL + HIGH)
    │
    ├── Zafiyet VAR → ❌ Pipeline kırılır
    │
    └── Temiz → ECR Push → Cosign Sign → ✅ Tamamlandı
```

### GitHub Ayarları

1. **AWS OIDC Provider** oluşturun (Thumbprint: GitHub Actions)
2. **IAM Role** oluşturun ve trust policy'ye GitHub repo'nuzu ekleyin
3. Workflow'daki `role-to-assume` ARN değerini güncelleyin
4. ECR repository oluşturun

## 🏥 Healthcheck Detayları

| Servis | Komut | Interval | Timeout | Retries |
|---|---|---|---|---|
| PostgreSQL | `pg_isready -U postgres` | 10s | 5s | 5 |
| Node.js | HTTP GET `/health` → 200 OK | 30s | 10s | 3 |

## 📊 Resource Limitleri

| Servis | CPU | Memory |
|---|---|---|
| app | 0.5 | 512 MB |
| db | 0.5 | 512 MB |

## 📝 Notlar

- `secrets/` klasörü `.gitignore`'dadır, **asla commit'lemeyin**.
- PostgreSQL portu dışarıya açılmamıştır (güvenlik gereği).
- Distroless imajda shell bulunmadığından `docker exec -it ... sh` çalışmaz. Debug için [debug imajı](https://github.com/GoogleContainerTools/distroless#debug-images) kullanın.
- Cosign doğrulama: `cosign verify --certificate-oidc-issuer=https://token.actions.githubusercontent.com <image>`
