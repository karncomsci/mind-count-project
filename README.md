# Mind Count

กลับมาทำงานต่อจาก session ใหม่: อ่าน [SESSION_HANDOFF.md](SESSION_HANDOFF.md) ซึ่งบันทึกบริบทงาน สถานะล่าสุด วิธีเปิดระบบหลังรีสตาร์ต และภาพอ้างอิงไว้ครบ

Monorepo สำหรับเว็บแอป โดยใช้ Nuxt 4 เป็น frontend/BFF, Go 1.25 เป็น API และ PostgreSQL 18 เป็นฐานข้อมูล สถาปัตยกรรม Modular Monolith แยก domain/service ออกจาก HTTP และ PostgreSQL adapter

**สถานะ: PHASE 0 พร้อมหน้าใบเสนอราคาตัวอย่าง** มี infrastructure และหน้า frontend สำหรับรายการ/สร้าง/แก้ไขใบเสนอราคา โทนขาว–เทาอ่อน หัวตารางสีฟ้า ปุ่มหลักสีเขียว พร้อมเมนูเอกสารการขาย ระบบ register/login/profile ยังไม่ได้เริ่ม

## คู่มือใบเสนอราคา

เปิด [รายการใบเสนอราคา](http://localhost:33000/sales/quotations) บนเครื่องนี้ หรือใช้พอร์ตที่ตั้งใน `.env`

1. เลือก **เอกสารการขาย → ใบเสนอราคา** เพื่อดูข้อมูลตัวอย่าง ค้นหา กรองสถานะ เรียงวันที่ หรือเปลี่ยนหน้า
2. กด **สร้างใหม่** กรอกชื่อลูกค้าและรายการสินค้า เลือกข้อมูลตัวอย่างจากช่องแนะนำหรือพิมพ์ข้อมูลใหม่
3. ระบุจำนวน ราคา ส่วนลด และภาษี ระบบคำนวณยอดให้ทันที เพิ่ม/ลบรายการได้
   ช่องเครดิตมีลูกศรให้เลือก **เครดิต (วัน)**, **เงินสด** หรือ **เครดิต (ไม่แสดงวันที่)** แบบรายวันพิมพ์จำนวนเต็ม 0–365 วันได้ หรือเลือกวันครบกำหนดเอง จำนวนวันและวันครบกำหนดจะปรับตามกัน เมื่อเปลี่ยนวันที่เอกสาร ระบบคำนวณวันครบกำหนดใหม่ ส่วนเงินสดและเครดิตไม่แสดงวันที่จะซ่อนวันครบกำหนดทั้งในฟอร์มและเอกสารพิมพ์
4. กด **บันทึกเอกสาร** แล้วเปิดจากเลขที่เอกสารเพื่อแก้ไข ข้อมูลยังอยู่เมื่อ reload เบราว์เซอร์เดิม
5. ติ๊กเลือกเอกสารเพื่อแสดงปุ่ม **ดาวน์โหลด PDF**, **พิมพ์เอกสาร** และ **พิมพ์จ่าหน้าซอง** ดาวน์โหลดหลายใบจะรวมเป็น PDF เดียว แยกหน้าแต่ละเอกสาร จ่าหน้าซองใช้ขนาด DL 220 × 110 มม. และชื่อลูกค้า/ที่อยู่ในเอกสาร
6. กดสถานะเพื่อเปลี่ยนเป็นร่าง รออนุมัติ ส่งแล้ว อนุมัติแล้ว ไม่อนุมัติ หรือหมดอายุ ค่าใหม่บันทึกในเบราว์เซอร์ทันที
7. เมนู **⋯** ของแต่ละใบมีแก้ไข พิมพ์ แชร์ ดาวน์โหลด PDF พิมพ์จ่าหน้าซอง สร้างซ้ำ และลบ การสร้างซ้ำได้เลขเอกสารใหม่และสถานะร่าง การลบต้องยืนยันก่อน
8. **แชร์** เตรียมไฟล์ PDF ให้เลือกแอปผ่านระบบแชร์ของเบราว์เซอร์ หากไม่รองรับให้ดาวน์โหลดไฟล์เพื่อส่งต่อเอง โน้ตภายในบริษัทไม่แสดงใน PDF/เอกสารพิมพ์ ส่วน **ส่งออก** เดิมยังดาวน์โหลด CSV ได้

ส่วนนี้เป็น frontend demo: ข้อมูลบันทึกใน `localStorage` ของเบราว์เซอร์และ origin ปัจจุบัน ยังไม่เชื่อม API/ฐานข้อมูลหรือซิงก์ข้อมูลข้ามเครื่อง ไม่มีระบบอัปโหลดไฟล์หรือลายเซ็นจริง สถานะปรับได้เพื่อทดลองใช้งานและไม่ได้เป็นระบบอนุมัติจากผู้ใช้อื่น เอกสารสร้างใหม่มีสถานะร่าง

เมนูเอกสารการขายมีครบ **ใบเสนอราคา, ใบวางบิล, ใบกำกับภาษี, ใบเสร็จรับเงิน, ขายเงินสด, ใบลดหนี้ และใบเพิ่มหนี้** อีก 6 ประเภทมีหน้ารองรับเมนูไว้ก่อนตามที่ร้องขอ รายละเอียดจะเพิ่มภายหลัง คำสั่งสร้างเอกสารต่อ/แบ่งจ่าย/มัดจำในเมนูสถานะจึงยังไม่เปิดใช้งาน

โค้ดแยก layout, sections ของฟอร์ม, state, validation และ calculation ดู [คู่มือแก้ไข component และโครงสร้าง frontend](docs/architecture/quotations-frontend.md) หากต้องการปรับสี/ระยะห่างให้แก้ `apps/web/app/assets/main.css`; เปลี่ยนข้อมูลตัวอย่างที่ `features/quotations/services/fixtures.ts`

## เครื่องมือที่ใช้

| เครื่องมือ | เวอร์ชัน | ใช้ทำอะไร | ติดตั้งที่ไหน |
|---|---|---|---|
| Go | 1.25.x | build/run/test backend และ migration command | global ผ่าน Homebrew; ทุกโปรเจกต์เรียก `go` ได้ |
| Node.js | 24 LTS | รัน Nuxt, pnpm, TypeScript และ Playwright | แนะนำติดตั้งบนเครื่อง; Docker ใช้ image Node 24 |
| pnpm | 10.34.5 | จัดการ workspace และ JavaScript dependencies | package manager บนเครื่อง; dependencies อยู่ใน `node_modules` |
| Docker Desktop หรือ Docker Engine + Compose | รุ่นที่รองรับ Compose `--wait` | รัน PostgreSQL/API/web และ testcontainers | บนเครื่อง ต้องเปิด daemon |
| PostgreSQL | 18-alpine | ฐานข้อมูลหลัก | Docker; ไม่ต้องติดตั้ง PostgreSQL global |
| sqlc | 1.30.0 | generate Go จาก SQL | `make tools` ติดตั้งใน Go bin |
| oapi-codegen | 2.8.0 | generate Go types + Chi server จาก OpenAPI 3.1 | `make tools` ติดตั้งใน Go bin |
| golangci-lint | 2.5.0 | lint Go และบังคับ dependency direction | `make tools` ติดตั้งใน Go bin |
| Goose | ดู `apps/api/go.mod` | migration Up/Down แบบ SQL ไฟล์เดียว | Go dependency; ใช้ผ่าน `cmd/migrate` ไม่ต้องมี Goose CLI |
| Chi + pgx/v5 + pgxpool | ดู `apps/api/go.mod` | HTTP routing, PostgreSQL driver และ connection pool | Go dependencies |
| Nuxt 4 + Vue 3 + TypeScript strict | ดู `apps/web/package.json` | frontend และ SSR | pnpm workspace dependencies |
| Tailwind CSS 4 | ดู lockfile | CSS ผ่าน Vite plugin | pnpm workspace dependencies |
| ESLint + Prettier | ดู lockfile | ตรวจโค้ดและจัดรูปแบบ Vue/TypeScript ให้อ่านง่าย | pnpm workspace dev dependencies |
| Pinia + Zod | ดู lockfile | state management และ validation | pnpm workspace dependencies |
| pdfmake + Sarabun | 0.3.11 / bundled OFL font | สร้าง PDF ภาษาไทยจากเบราว์เซอร์ โหลด library เมื่อใช้งาน | dependencies ของ frontend และฟอนต์ใน `public/fonts/sarabun` |
| openapi-typescript + openapi-fetch | ดู lockfile | generate TS types และเรียก API แบบมี type | pnpm workspace dependencies |
| Go testing + testcontainers-go | Go / ดู go.mod | unit tests และ integration tests กับ PostgreSQL จริง | integration ต้องมี Docker |
| Vitest | ดู lockfile | unit/component tests ฝั่งเว็บ | pnpm workspace dependency |
| Playwright | ดู lockfile | ทดสอบผ่าน browser | ติดตั้ง browser เพิ่มก่อนใช้ |
| Git + Make | บนเครื่อง | version control และรวมคำสั่ง | macOS Command Line Tools |

Dependencies ที่ระบุช่วงเวอร์ชันใน package.json ถูกล็อกเวอร์ชันจริงใน `pnpm-lock.yaml`; Go ถูกล็อกใน `go.mod` และ `go.sum` ห้ามอัปเกรดข้าม major ที่ล็อกใน Instruction/Markdown.md

## ติดตั้งเครื่องมือบน macOS

ติดตั้ง Homebrew และ Docker Desktop จากเว็บทางการก่อน จากนั้นเปิด Docker Desktop ให้ daemon ทำงาน

```sh
brew install go@1.25 node@24
npm install --global pnpm@10.34.5
```

Homebrew อาจติดตั้ง versioned formula แบบ keg-only ให้เพิ่ม PATH ลง `~/.zprofile` **ครั้งเดียว** แล้วเปิด Terminal ใหม่:

```sh
export PATH="/opt/homebrew/opt/go@1.25/bin:/opt/homebrew/opt/node@24/bin:$HOME/go/bin:$PATH"
```

ตัวอย่างข้างบนสำหรับ Apple Silicon; Intel Mac ใช้ `/usr/local/opt/` แทน `/opt/homebrew/opt/` การตั้งค่านี้ทำให้ Go ใช้ได้จากทุกโปรเจกต์ ไม่ต้องคัดลอก Go เข้าแต่ละ repository และ Go dependencies ยังแยกตาม `go.mod` ของแต่ละโปรเจกต์

```sh
go version
node --version
pnpm --version
docker version
docker compose version
```

Go ต้องเป็น 1.25.x และ Node ต้องเป็น 24.x สำหรับ workspace นี้ Makefile ตั้ง `GOTOOLCHAIN=local` เพื่อไม่ให้ Go เปลี่ยน major/minor อัตโนมัติ หากทีมใช้ Linux ให้ติดตั้ง Go 1.25, Node 24 และ Docker Engine พร้อม Compose plugin รุ่นที่รองรับ `docker compose up --wait`

การติดตั้งบนเครื่องนี้: Go 1.25.14 อยู่ใน Homebrew และเรียกผ่าน `/opt/homebrew/bin/go` ได้จากทุกโฟลเดอร์แล้ว ลบ Go ที่เคยอยู่ใน `_wrx-output/tools/go` และ archive ที่ดาวน์โหลดแล้ว เครื่องมือสำหรับตรวจงานอื่นที่อยู่ใต้ `_wrx-output/tools/` เป็นเครื่องมือชั่วคราวของการพัฒนา ไม่จำเป็นต่อการรัน Docker images

Docker Desktop บนเครื่องนี้ติดตั้งจาก DMG ทางการไว้ที่ `/Applications/Docker.app` พร้อม Docker CLI และ credential helpers ใน PATH ของ Homebrew ตรวจด้วย `docker version` และ `docker compose version` ก่อนรันระบบทุกครั้ง ไม่ต้องติดตั้ง PostgreSQL บน host เพิ่ม

## เริ่มใช้งาน

รันจาก root ของ repository:

```sh
cp .env.example .env
make dev
make migrate-up
```

`make dev` build และเริ่ม 3 services พร้อมรอ healthcheck: PostgreSQL → API → web เปิดเว็บที่ <http://localhost:3000> และ API ที่ <http://localhost:8080> การแก้ source ต้องรัน `make dev` อีกครั้งเพื่อ rebuild

**พอร์ตที่ใช้จริงบนเครื่องนี้:** `.env` ตั้ง `WEB_PORT=33000` และ `POSTGRES_PORT=55432` เพราะพอร์ต 3000/5432 มีโปรแกรมอื่นใช้อยู่ เปิดเว็บที่ <http://localhost:33000> และใช้ API ที่ <http://localhost:8080> ตามเดิม ตัวอย่างคำสั่งด้านล่างใช้ค่าเริ่มต้นจาก `.env.example`; บนเครื่องนี้ให้เปลี่ยนพอร์ตเว็บเป็น 33000 และรัน E2E ด้วย `PLAYWRIGHT_BASE_URL=http://127.0.0.1:33000 pnpm test:e2e` เก็บ `.env` ปัจจุบันไว้ ไม่ต้องคัดลอกทับเมื่อเริ่มทำงานครั้งถัดไป

```sh
docker compose ps
curl -i --max-time 5 http://localhost:8080/health/live
curl -i --max-time 5 http://localhost:8080/health/ready
curl -i --max-time 5 http://localhost:3000/api/health/ready
```

ทั้งสามคำสั่งควรได้ HTTP 200, JSON `{"status":"ok"}` และ header `X-Request-Id` โดย `/health/live` ไม่แตะฐานข้อมูล ส่วน `/health/ready` ping ฐานข้อมูลภายใต้ timeout เมื่อฐานข้อมูลไม่พร้อมต้องได้ 503 พร้อม error contract

```sh
make down
```

คำสั่ง down เก็บข้อมูลใน named volume ไว้ PostgreSQL 18 mount ที่ `/var/lib/postgresql` อย่าเปลี่ยนเป็นตำแหน่งเดิมของ image รุ่นก่อนหน้า

## พัฒนาโดยรัน Go และ Nuxt บนเครื่อง

```sh
pnpm install --frozen-lockfile
make tools
docker compose up -d postgres
```

Terminal สำหรับ API (โหลดเฉพาะไฟล์ `.env` ที่คุณเป็นผู้ดูแล):

```sh
set -a
. ./.env
set +a
cd apps/api
go run ./cmd/migrate up
go run ./cmd/api
```

Terminal สำหรับ Nuxt:

```sh
pnpm dev
```

Nuxt dev server ใช้ `http://localhost:8080` เป็น upstream เริ่มต้น ถ้าเปลี่ยนพอร์ต API ให้กำหนด `NUXT_API_BASE_URL` ใน environment ของ Nuxt ด้วย หน้าเว็บคุย same-origin ผ่าน Nuxt server; ห้ามเพิ่ม business logic ใน `server/`

## คำสั่งประจำวัน

| คำสั่ง | ผลลัพธ์ |
|---|---|
| `make dev` | build และเริ่มทั้ง 3 services พร้อมรอ healthy |
| `make down` | หยุด services โดยไม่ลบ named volume |
| `make migrate-up` | รัน Goose Up ผ่าน migration binary ใน API image |
| `make migrate-down` | rollback ล่าสุดหนึ่ง migration; ตรวจผลกระทบข้อมูลก่อนรัน |
| `make migrate-create name=create_users` | สร้างไฟล์ `YYYYMMDDHHMMSS_create_users.sql` เวลา UTC |
| `make seed` | รัน development seed; PHASE 0 ยังไม่มีข้อมูลธุรกิจ |
| `make tools` | ติดตั้ง sqlc, oapi-codegen, golangci-lint ตามเวอร์ชันที่ล็อก |
| `make generate` | generate sqlc, Go OpenAPI และ TS schema |
| `pnpm check:generated` | generate ซ้ำและตรวจว่า output ไม่เปลี่ยน |
| `make lint` | Go linters ตามที่กำหนด และ Nuxt ESLint |
| `make typecheck` | ตรวจ TypeScript strict |
| `make test` | Go tests พร้อม race detector และ Vitest |
| `make test-integration` | ทดสอบ PostgreSQL 18 จริงผ่าน testcontainers; ต้องมี Docker |
| `make build` | build Go API/migrator และ Nuxt production |
| `pnpm test:e2e` | Playwright บน stack ที่เปิดไว้แล้ว |
| `pnpm --filter @mind-count/web format` | จัดรูปแบบ source frontend ด้วย Prettier |

หลังแก้ migrations ต้อง rebuild API image ก่อนใช้ `make migrate-up` เพราะ migration ถูก embed ตอน build ห้ามแก้ migration ที่ merge แล้ว ให้สร้างไฟล์ใหม่ ส่วน baseline PHASE 0 ใช้ `SELECT 1` และยังไม่สร้าง users/sessions

## Generate: แก้ต้นทางเท่านั้น

```sh
pnpm install --frozen-lockfile
make tools
make generate
pnpm check:generated
```

| แก้ไฟล์ต้นทาง | output ที่ห้ามแก้ด้วยมือ |
|---|---|
| `contracts/openapi/openapi.yaml` | `apps/api/internal/transport/http/openapi/generated.go` |
| `contracts/openapi/openapi.yaml` | `apps/web/app/lib/api/generated/schema.ts` |
| `apps/api/internal/db/queries/*.sql` และ migrations | `apps/api/internal/db/gen/*.go` |

Contract ใช้ OpenAPI 3.1 จริง oapi-codegen config ใช้ชื่อ option `models: true` สำหรับการสร้าง types และ `chi-server: true` สำหรับ router interface

## ทดสอบว่าพร้อมใช้งาน

```sh
make lint
make typecheck
make test
make test-integration
pnpm check:generated
make build
make dev
pnpm exec playwright install chromium
pnpm test:e2e
```

Unit tests ตรวจ config, health/error contract, domain error mapping, CORS, rate limit และ panic recovery รวมถึงการคำนวณ/validation/storage ของใบเสนอราคา Integration tests ตรวจ migration up/down, sqlc executor, transaction commit/rollback/panic/cancellation/nested scope และ readiness กับฐานข้อมูลจริง E2E ตรวจ health proxy และสร้าง → บันทึก → reload → ค้นหา → แก้ไขใบเสนอราคา รวมถึงการพิมพ์และหน้าจอมือถือ

CI รันตามลำดับ lint → typecheck → unit → integration → generated diff → build แล้วตรวจ Compose และ browser อีกครั้ง ผลจาก runtime เก็บใน `_wrx-output/` ซึ่งถูก gitignore

## Environment variables

ค่าทั้งหมดที่ใช้ใน PHASE 0 อยู่ใน `.env.example` ห้าม commit `.env` หรือพิมพ์ DSN/cookie/password ลง log

| ตัวแปร | ค่าเริ่มต้น / หน้าที่ |
|---|---|
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` | ผู้ใช้/รหัสผ่าน/ฐานข้อมูลสำหรับ Compose; รหัสตัวอย่างใช้พัฒนาเท่านั้น |
| `POSTGRES_PORT`, `API_PORT`, `WEB_PORT` | พอร์ตบน host: 5432 / 8080 / 3000 |
| `DATABASE_URL` | **จำเป็น** สำหรับ Go; PostgreSQL URL พร้อมชื่อฐานข้อมูล |
| `HTTP_ADDR` | `:8080` |
| `LOG_LEVEL` | `info`; รองรับ debug/info/warn/error |
| `DB_MAX_CONNS` | 10 |
| `DB_MAX_CONN_LIFETIME` | 30m |
| `DB_HEALTH_CHECK_PERIOD` | 30s |
| `DB_CONNECT_TIMEOUT` | 5s |
| `DB_OPERATION_TIMEOUT` | 5s; ใช้กำหนด transaction deadline |
| `HTTP_READ_TIMEOUT`, `HTTP_READ_HEADER_TIMEOUT` | 10s / 5s |
| `HTTP_WRITE_TIMEOUT`, `HTTP_IDLE_TIMEOUT` | 15s / 60s |
| `SHUTDOWN_TIMEOUT` | 10s |
| `READINESS_TIMEOUT` | 2s; ต้องสั้นกว่า HTTP write timeout |
| `MIGRATION_TIMEOUT` | 2m |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:3000`; คั่นหลาย origin ด้วย comma; ห้าม `*` |
| `RATE_LIMIT_RPS`, `RATE_LIMIT_BURST` | 20 / 40 ต่อ TCP peer |
| `RATE_LIMIT_MAX_CLIENTS` | 10000; จำกัดขนาด in-memory map |
| `NUXT_API_BASE_URL` | upstream เฉพาะ server; Compose กำหนด `http://api:8080` |
| `NUXT_API_TIMEOUT_MS` | 5000 |
| `PLAYWRIGHT_BASE_URL` | `http://127.0.0.1:3000` |

ถ้าเปลี่ยน credentials ให้แก้ทั้งค่าของ Compose และ host-side `DATABASE_URL` ให้ตรงกัน รหัสที่ประกอบใน URL ต้องใช้ URL-safe characters หรือ percent encoding และหากเปลี่ยน WEB_PORT ต้องปรับ CORS origin ด้วย

## โครงสร้างและข้อควรทราบ

- `apps/api/internal/bootstrap`: composition root และ lifecycle
- `apps/api/internal/modules/{user,auth}`: domain/service กับ adapter `http/` และ `postgres/`; PHASE 0 ระบุไฟล์ไว้สำหรับขั้นถัดไป
- `apps/api/internal/platform`: config, logger, database, ID และพื้นที่สำหรับ validation
- `apps/api/internal/transport/http`: middleware, public errors และ generated contract
- `apps/web/app/features`: feature modules; ให้ภายนอก import ผ่าน `index.ts`
- `apps/web/server`: proxy/BFF เท่านั้น
- `contracts/openapi`: contract ต้นทาง
- `_bmad-output/implementation-artifacts`: ขอบเขตงานและรายงาน review
- `_wrx-output`: เครื่องมือชั่วคราวและหลักฐานการตรวจ ไม่ใช่ source code

Rate limiter ของ PHASE 0 ใช้ TCP peer เพื่อไม่เชื่อ `X-Forwarded-For` จาก client โดยไม่มี trusted proxy policy เมื่อวิ่งผ่าน Nuxt ผู้ใช้จึงใช้ bucket ของ proxy ร่วมกัน ต้องทบทวน trusted proxy และ auth limits ใน PHASE 1 ก่อนใช้งานจริง

## Deploy

Dockerfiles เป็น multi-stage build และ runtime ใช้ non-root user สำหรับ PHASE 0 ใช้ Compose ตรวจระบบภายในเครื่องก่อน deploy จริงต้องกำหนด secrets ของ environment, HTTPS ingress และ migration step แยกจาก startup ห้ามใช้รหัสผ่านตัวอย่างใน production ระบบ authentication ยังไม่ได้ทำและยังไม่ถือว่า application พร้อมใช้งาน production

## แก้ปัญหาเบื้องต้น

- `go: command not found`: เปิด Terminal ใหม่แล้วตรวจ PATH ของ Homebrew Go
- `sqlc` / `oapi-codegen` / `golangci-lint` ไม่พบ: รัน `make tools` และเพิ่ม `$HOME/go/bin` ใน PATH
- `DATABASE_URL` หาย: host-side Go ไม่โหลด `.env` เอง ต้อง export ตามขั้นตอนด้านบน; Compose โหลดผ่าน env_file
- ต่อ Docker ไม่ได้: เปิด Docker Desktop และตรวจ `docker version`; integration tests ไม่ใช้ mock แทนฐานข้อมูลจริง
- API ขึ้นไม่สำเร็จ: ตรวจ `docker compose logs api postgres` โดยอย่าเผยแพร่ข้อมูลลับ
- แก้ dependency แล้ว build ไม่ตรง lockfile: รัน `pnpm install` แล้ว review `pnpm-lock.yaml`
- ไม่มี Git repository: workspace ต้นทางนี้ยังไม่ได้ `git init`; generator check ทำงานได้ แต่ก่อน push/CI ให้สร้าง repository และ commit source ตาม workflow ของทีม

## แหล่งอ้างอิงเวอร์ชัน

- [Nuxt 4 installation](https://nuxt.com/docs/4.x/getting-started/installation)
- [Go installation](https://go.dev/doc/install)
- [PostgreSQL official Docker image และ volume ของเวอร์ชัน 18](https://hub.docker.com/_/postgres)
- [oapi-codegen 2.8.0: OpenAPI 3.1 และ Go 1.25](https://github.com/oapi-codegen/oapi-codegen/releases/tag/v2.8.0)
- [golangci-lint configuration](https://golangci-lint.run/docs/configuration/file/)
