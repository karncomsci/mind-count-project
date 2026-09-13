# ROLE
คุณคือ Senior Go + Nuxt Engineer ที่เชี่ยวชาญ Modular Monolith, Monorepo และ Clean Architecture
ทำงานแบบ spec-first, test-first และห้ามสร้าง abstraction ที่ยังไม่จำเป็น (YAGNI)

# STACK (ล็อกแล้ว ห้ามเปลี่ยน)
- Frontend: Nuxt 4 + Vue 3 + TypeScript (strict) + Tailwind v4 + Pinia + Zod
- Backend: Go 1.25 + Chi router + pgx/v5 + pgxpool + sqlc
- Database: PostgreSQL 18
- Migration: Goose (ไฟล์เดียว ใช้ annotation `-- +goose Up` / `-- +goose Down`)
- Contract: OpenAPI 3.1 spec-first → oapi-codegen (Go) + openapi-typescript + openapi-fetch (TS)
- Monorepo: pnpm workspaces
- Test: Go testing + testcontainers-go, Vitest, Playwright
- Container: Docker Compose

# หลักการที่ห้ามละเมิด
1. Dependency direction: `bootstrap → http → service → repository interface ← postgres impl`
   domain/service ห้าม import `net/http`, `chi`, `pgx` เด็ดขาด
2. ห้ามส่ง DB model หรือ sqlc struct ออก API → ต้องมี mapper แปลงเป็น DTO เสมอ
3. ทุก external call รับ `context.Context` และมี timeout
4. Transaction จัดการผ่าน `TxManager` + context injection เท่านั้น
5. Module อื่นเรียกข้ามกันได้ผ่าน narrow interface ที่ประกาศฝั่งผู้ใช้เท่านั้น
6. Generated code (sqlc, oapi-codegen, openapi-typescript) ห้ามแก้ด้วยมือ
7. Migration ที่ merge แล้วห้ามแก้ย้อนหลัง ให้สร้างไฟล์ใหม่
8. ห้าม package ชื่อ `utils`, `common`, `helpers` ใน Go
9. ห้ามใส่ business logic ใน Nuxt `server/` (ใช้เป็น proxy/BFF เท่านั้น)
10. ห้าม commit `.env` หรือ secret ใดๆ

# 6 DECISION ที่ล็อกไว้แล้ว
| # | เรื่อง | ค่าที่ใช้ |
|---|---|---|
| 1 | Transaction | `TxManager.WithinTx(ctx, fn)` + `Executor(ctx)` ผ่าน context |
| 2 | Module layout | แยก subpackage `http/` + `postgres/` ทุกโมดูล (ไม่ใช้ flat) |
| 3 | OpenAPI | spec-first, oapi-codegen mode `chi-server`+`types`, TS ใช้ openapi-typescript |
| 4 | Migration | Goose, ชื่อไฟล์ `YYYYMMDDHHMMSS_name.sql` |
| 5 | Auth | Argon2id + JWT ใน HttpOnly/Secure/SameSite=Lax cookie, browser คุยผ่าน Nuxt server proxy (same-origin) |
| 6 | Error contract | `{"error":{"code","message","details","requestId"}}` |

# DIRECTORY TREE (สร้างให้ครบทุกโฟลเดอร์)
```
project-name/
├── apps/
│   ├── web/
│   │   ├── app/
│   │   │   ├── assets/
│   │   │   ├── components/{base,layout}/
│   │   │   ├── composables/
│   │   │   ├── features/
│   │   │   │   ├── auth/{components,composables,schemas,services,stores,types}/ + index.ts
│   │   │   │   └── users/{components,composables,schemas,services,stores,types}/ + index.ts
│   │   │   ├── layouts/
│   │   │   ├── lib/api/{generated/,client.ts,errors.ts}
│   │   │   ├── middleware/
│   │   │   ├── pages/
│   │   │   ├── plugins/
│   │   │   ├── stores/
│   │   │   ├── utils/
│   │   │   ├── app.vue
│   │   │   └── error.vue
│   │   ├── server/{api/,lib/}
│   │   ├── shared/{types,constants,utils}/
│   │   ├── public/
│   │   ├── tests/{unit,component}/
│   │   ├── nuxt.config.ts
│   │   ├── eslint.config.mjs
│   │   ├── tsconfig.json
│   │   ├── package.json
│   │   └── Dockerfile
│   └── api/
│       ├── cmd/
│       │   ├── api/main.go
│       │   └── migrate/main.go
│       ├── internal/
│       │   ├── bootstrap/{container.go,routes.go,server.go}
│       │   ├── modules/
│       │   │   ├── user/
│       │   │   │   ├── user.go
│       │   │   │   ├── service.go
│       │   │   │   ├── repository.go
│       │   │   │   ├── errors.go
│       │   │   │   ├── postgres/repository.go
│       │   │   │   └── http/{handler.go,dto.go,mapper.go,routes.go}
│       │   │   └── auth/   (โครงเดียวกับ user)
│       │   ├── platform/
│       │   │   ├── config/config.go
│       │   │   ├── database/{pool.go,tx.go}
│       │   │   ├── id/id.go
│       │   │   ├── logger/logger.go
│       │   │   └── validator/validator.go
│       │   ├── transport/http/
│       │   │   ├── middleware/{requestid.go,logger.go,recover.go,cors.go,ratelimit.go,auth.go}
│       │   │   ├── httperr/httperr.go
│       │   │   ├── pagination/pagination.go
│       │   │   └── openapi/generated.go
│       │   └── db/
│       │       ├── migrations/
│       │       ├── queries/
│       │       ├── seeds/
│       │       ├── gen/
│       │       └── embed.go
│       ├── tests/{integration,testdata}/
│       ├── .golangci.yml
│       ├── sqlc.yaml
│       ├── go.mod
│       └── Dockerfile
├── contracts/openapi/{openapi.yaml,paths/,components/,oapi-codegen.yaml}
├── deployments/docker/
├── docs/{architecture,adr,api,database}/ + onboarding.md
├── tests/e2e/
├── scripts/
├── .github/workflows/ci.yml
├── compose.yaml
├── Makefile
├── pnpm-workspace.yaml
├── package.json
├── .env.example
├── .editorconfig
├── .gitignore
├── README.md
└── CONTRIBUTING.md
```

# งานที่ต้องทำ (ทำตามลำดับ)

## PHASE 0 — Skeleton + Infrastructure
- สร้าง tree ทั้งหมดข้างบน (ห้ามข้ามโฟลเดอร์ ห้ามทิ้งไฟล์เปล่า)
- `compose.yaml`: postgres 18-alpine (healthcheck + named volume), api, web
- `Makefile`: `dev, down, migrate-up, migrate-down, migrate-create, generate, lint, test, test-integration, seed`
- `pnpm-workspace.yaml` + root `package.json`
- `.env.example` ครบทุกตัวแปร + `.gitignore` + `.editorconfig`
- `platform/config` — โหลด env ครั้งเดียว, fail fast ถ้าค่าจำเป็นหาย
- `platform/logger` — `log/slog` แบบ JSON
- `platform/database/pool.go` — pgxpool + config (MaxConns, MaxConnLifetime, HealthCheckPeriod)
- `platform/database/tx.go` — `TxManager` ที่มี `WithinTx(ctx, fn)` และ `Executor(ctx)` (ส่ง tx ผ่าน unexported context key, defer Rollback, commit เมื่อ fn สำเร็จ)
- `transport/http/httperr` — error type กลาง + mapper domain error → HTTP status ตาม error contract
- `transport/http/middleware` — requestID, structured logger, recover, CORS, rate limit
- `bootstrap/server.go` — HTTP server + timeouts + graceful shutdown (SIGINT/SIGTERM)
- `bootstrap/container.go` + `routes.go` — composition root (wiring ทั้งหมดอยู่ที่นี่ที่เดียว)
- `cmd/api/main.go`, `cmd/migrate/main.go`
- `internal/db/embed.go` — `//go:embed migrations/*.sql`
- `sqlc.yaml` — engine postgresql, sql_package `pgx/v5`, `emit_json_tags: false`, override uuid/timestamptz
- `.golangci.yml` — enable: errcheck, govet, staticcheck, revive, bodyclose, sqlclosecheck, contextcheck, noctx, depguard
  depguard: ห้าม `internal/modules/*/*.go` (ยกเว้น subpackage http/postgres และ `_test.go`) import `net/http`, `chi`, `pgx`
- Endpoint `/health/live` และ `/health/ready` (ready ตรวจ DB ping แบบเบา)
- `.github/workflows/ci.yml`: lint → typecheck → unit → integration → sqlc generate diff check → build

**Acceptance:** `make dev` ขึ้นครบ 3 service, `curl localhost:8080/health/ready` ได้ 200, `golangci-lint run` ผ่าน

## PHASE 1 — Vertical Slice แรก (ทำแค่นี้ อย่าทำเกิน)
`POST /api/v1/auth/register` → `POST /api/v1/auth/login` → `GET /api/v1/users/me`

ลำดับการทำ:
1. เขียน `contracts/openapi/openapi.yaml` ครบ 3 endpoint + error schema กลาง
2. Goose migration: `users` (id UUIDv7 PK, email citext unique, password_hash, display_name, created_at/updated_at timestamptz, deleted_at nullable) + `sessions`
3. `internal/db/queries/users.sql` + `sessions.sql` → รัน sqlc generate
4. `modules/user/`: `user.go` (entity + validation), `repository.go` (interface), `postgres/repository.go` (ใช้ sqlc + `Executor(ctx)`), `service.go`, `errors.go`
5. `modules/auth/`: Argon2id hash, JWT access+refresh, narrow interface `UserReader` ประกาศฝั่ง auth
6. `modules/*/http/`: handler + dto + mapper + routes
7. Wire ทั้งหมดใน `bootstrap/container.go`
8. Generate TS client → `apps/web/app/lib/api/generated/`
9. Nuxt: `server/api/` proxy ไป Go, `features/auth/` (schemas/services/composables/store), หน้า `/register`, `/login`, `/profile`, middleware `auth`
10. Integration test (testcontainers): register สำเร็จ / email ซ้ำ / login ผิด password / `/users/me` ไม่มี token ต้อง 401
11. E2E Playwright: register → login → เห็นชื่อตัวเองในหน้า profile

**Acceptance:**
- register แล้วมี user ใน DB + password เป็น Argon2id hash (ไม่ใช่ plaintext)
- login ได้ HttpOnly cookie กลับมา
- `/users/me` ไม่มี cookie → 401 พร้อม error contract ที่ถูกต้อง
- ทุก response มี `X-Request-Id`
- `make test` และ `make test-integration` เขียวทั้งหมด

## PHASE 2 — เอกสาร
- `README.md`: ระบบทำอะไร, prerequisites, `make dev`, migration, generate, test, env vars, deploy
- `CONTRIBUTING.md`: กฎ 10 ข้อด้านบน + convention การตั้งชื่อ + PR checklist
- `docs/adr/`: 0001-modular-monolith, 0002-openapi-contract-first, 0003-sqlc-over-orm, 0004-txmanager-pattern
- `docs/onboarding.md`: dev ใหม่เริ่มยังไงใน 30 นาที

# รูปแบบการตอบ
- ทำทีละ PHASE แล้วหยุดรอผมยืนยันก่อนไป PHASE ถัดไป
- แต่ละไฟล์: ระบุ path เต็ม + โค้ดเต็ม (ไม่ใช้ `// ...` ย่อ)
- จบแต่ละ PHASE ให้สรุป: ไฟล์ที่สร้าง, คำสั่งที่ต้องรัน, วิธีตรวจว่าผ่าน
- ถ้ามีจุดที่ต้องตัดสินใจเพิ่ม ให้ถามก่อน อย่าเดาเอง

# สิ่งที่ห้ามทำ
- microservices, Kubernetes, GraphQL, event bus, gRPC
- ORM (GORM/ent) — ใช้ sqlc เท่านั้น
- Redis/cache ก่อนวัดผลจริง
- background job queue (ยังไม่มี use case)
- repository interface สำหรับทุกตารางโดยไม่มี use case รองรับ
- โมดูลที่ 3 ก่อน Phase 1 ผ่าน review

เริ่มที่ PHASE 0 ได้เลย