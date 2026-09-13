# Mind Count — บันทึก session สำหรับทำงานต่อหลังรีสตาร์ต

บันทึกวันที่ **13 กันยายน 2026**, เขตเวลา **Asia/Bangkok**

Workspace: `/Users/kittipat/work-shop/mind-count`

คำขอสุดท้ายของผู้ใช้: **บันทึกข้อมูล session นี้ทั้งหมดเป็น .md เพื่อรีสตาร์ตเครื่องแล้วกลับมาสั่งงานจาก session ใหม่**

เอกสารนี้รวบรวมบริบทคำสั่ง การตัดสินใจ งานที่เสร็จ โครงสร้างโค้ด ผลทดสอบ ข้อจำกัด ภาพอ้างอิง และวิธีเริ่มระบบต่อ เป็นบันทึกส่งต่องาน ไม่ใช่สำเนา raw tool logs ทุกบรรทัด โค้ดจริงและเอกสารประกอบยังอยู่ใน workspace เดิม ไม่มีการเก็บรหัสผ่านหรือเนื้อหา `.env` ลงไฟล์นี้

## 1. อ่านตรงนี้ก่อนเริ่ม session ใหม่

- **Phase 0 infrastructure เสร็จแล้ว** และผ่านการทดสอบจริงทั้ง Go, Nuxt, PostgreSQL, Docker Compose และ health proxy
- **หน้าใบเสนอราคาเสร็จในรูปแบบ frontend demo**: list / create / edit, เครดิตและวันครบกำหนด, คำนวณยอด, บันทึกใน browser, สถานะ, PDF, พิมพ์, จ่าหน้าซอง, แชร์, สร้างซ้ำ และลบ
- **เมนูเอกสารการขายครบ 7 รายการแล้ว** อีก 6 ประเภทยังเป็นหน้ารองรับเมนูตามที่ผู้ใช้สั่งว่า “ส่วนรายละเอียดเดี๋ยวให้ข้อมูลอีกที”
- **Auth Phase 1 ยังไม่ได้เริ่ม** ไม่ควรตีความว่าการกลับมา session ใหม่อนุมัติให้เริ่ม auth หรือเอกสารประเภทอื่นเอง
- **Go เป็น global แล้ว** ตามคำสั่งสุดท้ายของผู้ใช้ ใช้ได้ทุก project; ลบ Go distribution/archive ที่เคยอยู่ local แล้ว อย่าติดตั้ง Go local กลับมา
- งานล่าสุดไม่มี blocker ค้าง ก่อนหยุดมีผลตรวจ **18 unit tests + 7 browser E2E = 25 tests ผ่าน**, lint/typecheck/build ผ่าน
- ผู้ใช้ต้องการ **โทนสว่าง ใช้งานง่าย ไม่รก**: พื้นขาว/เทาอ่อน หัวตารางฟ้า ปุ่มหลักเขียว เมนูด้านซ้าย และ component แยกหน้าที่ชัดเจน
- เปิดแอปจริงบนเครื่องนี้ที่ **http://localhost:33000/sales/quotations**; API 8080; PostgreSQL host 55432
- **ไม่มี Git repository** ใน workspace นี้ ณ เวลาบันทึก จึงไม่มี commit, branch, PR หรือ remote CI run ให้กลับไปอ้างอิง

## 2. วิธีทำงานต่อหลังเปิดเครื่อง

เปิด Docker Desktop แล้วรอ engine พร้อม จากนั้น:

```sh
cd /Users/kittipat/work-shop/mind-count
docker version
docker compose up -d --no-build --wait
docker compose ps
```

เปิด [รายการใบเสนอราคา](http://localhost:33000/sales/quotations) หรือ [สร้างใบเสนอราคา](http://localhost:33000/sales/quotations/new)

ตรวจการเชื่อมต่อ:

```sh
curl -i --max-time 5 http://localhost:8080/health/ready
curl -i --max-time 5 http://localhost:33000/api/health/ready
```

ถ้าไม่มี images หรือมีการแก้ source แล้วต้องการ rebuild:

```sh
make dev
```

ถ้าเปลี่ยนเฉพาะ frontend และ API/ฐานข้อมูลกำลังทำงาน:

```sh
docker compose up -d --no-deps --build --wait web
```

ข้อควรจำสำหรับ workspace นี้:

- เก็บ `.env` เดิมไว้ **ไม่ต้อง `cp .env.example .env` ทับ** เมื่อกลับมาทำต่อ
- ค่าพอร์ตที่ตรวจจาก `.env` ตอนบันทึก: `WEB_PORT=33000`, `API_PORT=8080`, `POSTGRES_PORT=55432`
- พอร์ต 3000 และ 5432 มีโปรแกรมอื่นใช้มาก่อน จึงต้องรักษาบริการอื่นไว้ ไม่ kill หรือล้างพอร์ตเหล่านั้น
- `make down` หยุด Compose และเก็บ named volume; อย่าเพิ่ม `-v` หากไม่ตั้งใจลบฐานข้อมูล
- Compose ใช้ PostgreSQL 18 และ mount volume ที่ `/var/lib/postgresql`
- ภายใน session เคยพบ Compose services ถูกหยุด ทำให้ health proxy ตอบ 502; ตรวจ `docker compose ps` และเริ่ม services ก่อนวิเคราะห์ว่าเป็นบั๊กของโค้ด
- อย่าอาศัย PID, tool cell ID หรือ process session ID จาก session เก่า หลังรีเครื่องค่าเหล่านี้ใช้ต่อไม่ได้
- dev server ชั่วคราวที่พอร์ต 33100 เคยเปิดเพื่อวิเคราะห์งานและหยุดแล้ว ไม่ใช่ URL ใช้งานหลัก

## 3. ลำดับคำสั่งและการตัดสินใจของผู้ใช้

| ลำดับ | คำขอ/ข้อมูลที่ผู้ใช้ให้ | ผลลัพธ์และขอบเขตที่ตกลง |
|---|---|---|
| 1 | ให้อ่าน วิเคราะห์ และทำตาม `/Users/kittipat/work-shop/mind-count/Instruction/Markdown.md` | สร้าง Phase 0 ตาม stack/โครงสร้างที่ล็อกไว้ |
| 2 | ให้สร้าง `README.md` เป็นคู่มือและระบุ tools ที่ใช้ | มีคู่มือภาษาไทย ครอบคลุมเครื่องมือ ติดตั้ง รัน ทดสอบ environment และวิธีพัฒนา |
| 3 | ถามเรื่อง Go global/local และแก้คำสั่งหลายครั้ง | **คำสั่งสุดท้ายที่มีผล: เอา local ออกแล้วติดตั้ง global ให้ใช้ได้ทุก project** |
| 4 | ขอหยุดไว้ก่อน แล้วกลับมาบอกให้ทำต่อ | ทำ infrastructure/verification ต่อจน Phase 0 ผ่าน |
| 5 | ส่งภาพหน้ารายการและหน้าสร้างใบเสนอราคา ขอเมนูหลักเอกสารการขาย/เมนูย่อยใบเสนอราคา และแยก frontend component | เพิ่ม feature quotations โดยใช้ข้อมูลตัวอย่างและ browser storage ไม่มี Go module/API/schema ธุรกิจใหม่ |
| 6 | ขอ template โทนคล้ายภาพ สว่าง ใช้งานง่าย ไม่รก | ปรับขาว/เทาอ่อน ฟ้า/เขียว ลดการ์ดสรุปและข้อความซ้ำ |
| 7 | ส่งภาพเครดิต ขอเลือกแบบ “เครดิต (วัน)”, “เงินสด”, “เครดิต (ไม่แสดงวันที่)” และให้แก้วันครบกำหนดเองได้ | เพิ่ม credit mode และ dueDate ที่บันทึกจริง จำนวนวัน/วันที่ปรับตามกัน พร้อมรองรับเอกสารเก่า |
| 8 | ส่งภาพปุ่มเมื่อเลือกแถว เมนูสถานะ และเมนูจัดการ ขอ PDF/พิมพ์/จ่าหน้าซอง/แก้ไข/แชร์/ลบ | ทำ batch actions, persisted status, row menu, PDF ภาษาไทย, native print/share fallback, duplicate และยืนยันก่อนลบ |
| 9 | ชี้แจงว่าเมนูมีใบเสนอราคา ใบวางบิล ใบกำกับภาษี ใบเสร็จรับเงิน ขายเงินสด ใบลดหนี้ ใบเพิ่มหนี้ ให้สร้างเมนูครบก่อน รายละเอียดจะให้ภายหลัง | เพิ่มเมนูทั้ง 7 พร้อมหน้าเปล่าที่ระบุรอรายละเอียดสำหรับอีก 6 ประเภท ไม่เริ่ม business workflow เหล่านั้น |
| 10 | ให้บันทึก session เป็น .md เพื่อรีเครื่องและเริ่ม session ใหม่ | สร้างไฟล์นี้ พร้อมสำเนาภาพอ้างอิงและผลงานถาวรใน docs/session-assets |

การชี้แจงข้อ 9 ตอบคำถามเรื่องเมนูสร้างเอกสารต่อในภาพ ไม่ได้ยกเลิกงานปุ่มจัดการใบเสนอราคาข้อ 8 งานทั้งสองส่วนจึงทำเสร็จในรอบเดียวกัน

## 4. ข้อกำหนดการทำงานที่ต้องรักษา

ต้นทางหลักคือ [Instruction/Markdown.md](Instruction/Markdown.md), [CONTRIBUTING.md](CONTRIBUTING.md) และคำสั่ง AGENTS.md ที่ผู้ใช้ส่งใน chat

เก็บสำเนาคำสั่ง AGENTS.md จากผู้ใช้ฉบับเต็มไว้ที่ [USER_AGENTS_INSTRUCTIONS.md](docs/session-assets/2026-09-13/USER_AGENTS_INSTRUCTIONS.md) ด้วย

### Stack ที่ล็อกไว้

- Frontend: **Nuxt 4 + Vue 3 Composition API + TypeScript strict + Tailwind CSS 4 + Pinia + Zod**
- Backend: **Go 1.25 + Chi + pgx/v5 + pgxpool + sqlc**
- Database: **PostgreSQL 18**
- Migration: **Goose**, Up/Down annotations ในไฟล์ SQL เดียว
- Contract: **OpenAPI 3.1**, Go/TS generated types
- Workspace: **pnpm 10**, Node **24 LTS**
- Tests: Go testing/testcontainers, Vitest, Playwright
- Runtime: Docker Compose, Modular Monolith; ไม่เพิ่ม microservices, ORM, Redis, event bus, GraphQL หรือ Kubernetes

### หลักการสำคัญ

- แยก frontend component ตามหน้าที่ หน้า route บาง, typed props/emits, composable ประสานงาน, store ดูแล saved state, services ดูแล pure logic และ adapter
- Go dependency direction: `bootstrap → http → service → repository interface ← postgres adapter`
- Go domain/service ห้าม import `net/http`, `chi`, `pgx`; HTTP ใช้ DTO/mapper ไม่ปล่อย DB model โดยตรง
- Nuxt `server/` เป็น BFF/proxy ไม่ใส่ business logic ใหม่ที่นั่น
- แก้ OpenAPI/SQL ต้นทางแล้ว generate ห้ามแก้ generated files ด้วยมือ
- ห้ามแก้ migration ที่ใช้งานไปแล้วเพื่อเปลี่ยนประวัติ ให้เพิ่ม migration ใหม่
- ปกป้อง user changes, secrets และ `.env`; ไม่พิมพ์ DSN/password/cookie ลง log
- ไม่ติดตั้ง tools global เพิ่มเองเพียงเพราะเริ่ม session ใหม่ โดย Go เป็นกรณีที่ผู้ใช้สั่ง global ชัดเจนแล้ว
- เดิม Instruction กำหนดทีละ Phase; คำขอใบเสนอราคาเป็นงาน frontend ที่ผู้ใช้สั่งเพิ่มโดยตรง ไม่ใช่การอนุมัติ auth Phase 1

### Wrixon/BMAD จาก AGENTS.md ที่ผู้ใช้ส่ง

- Runtime profile ที่ใช้: **codex-only**
- ก่อน implementation/review ให้ระบุ `PATH: A | B | C`, `REASON`, `EVIDENCE`, `MODEL ROUTE`
- Path A: small pattern-following ไม่มี architecture/schema/transport/public contract change
- Path B: multi-file, nuanced, user-facing หรือจำเป็นต้องเพิ่ม coverage/tests
- Path C: new subsystem, architecture, integration, migration หรือ blast radius ไม่ชัด
- Phase 0 ใช้ Path C; งาน quotation UI/credit/actions ใช้ Path B
- BMAD artifacts อยู่ `_bmad-output/implementation-artifacts/`
- Runtime tools/evidence อยู่ `_wrx-output/`
- Path B/C bug fix ต้องมี red proof ก่อนแก้
- ไม่อ้างว่าผ่านโดยไม่มี focused tests/evidence
- ไม่ได้ใช้ sub-agent ใน session นี้

## 5. เครื่องมือและ environment ที่ตรวจพบ

| สิ่งที่ใช้ | ตำแหน่ง/เวอร์ชัน | หมายเหตุ |
|---|---|---|
| Go global | `/opt/homebrew/bin/go`, `go1.25.14 darwin/arm64` | ติดตั้งผ่าน Homebrew; ทดลองเรียกจากนอก project แล้ว |
| Go formula | `/opt/homebrew/opt/go@1.25/bin` | GOTOOLCHAIN=local ใน Makefile |
| Go local เก่า | `_wrx-output/tools/go` และ archive | **ลบแล้วตามคำสั่งผู้ใช้** |
| Node ใน PATH ปัจจุบัน | v25.6.1 | ไม่ตรง engines ของ workspace นี้ |
| Node 24 สำหรับ verification | `_wrx-output/tools/node/node_modules/.bin/node`, v24.21.0 | ใช้ตัวนี้กับ pnpm/tests หาก Node global ยังเป็น 25 |
| pnpm | `_wrx-output/tools/node/node_modules/pnpm/bin/pnpm.cjs`, 10.34.5 | ไม่มี pnpm ใน PATH เริ่มต้นตอนตรวจ handoff |
| Docker Desktop | `/Applications/Docker.app` | ติดตั้งจาก DMG ทางการ; ไม่ต้องติดตั้งซ้ำ |
| Docker CLI | `/opt/homebrew/bin/docker` | มี credential helpers ใน Homebrew PATH |
| Docker รุ่นที่บันทึกใน Phase 0 | Desktop 4.90.0 / Engine 29.7.2 / Compose 5.5.1 | เป็นค่าจากรอบตรวจเดิม ให้ `docker version` ยืนยัน runtime หลัง reboot |
| Go codegen/lint tools | `_wrx-output/tools/bin/` | sqlc 1.30.0, oapi-codegen 2.8.0, golangci-lint 2.5.0 |
| Browser test binaries | `_wrx-output/tools/playwright` | runner ตั้ง PLAYWRIGHT_BROWSERS_PATH ให้ |
| PDF | pdfmake 0.3.11, @types/pdfmake 0.3.3 | dependencies ภายใน project; lazy import เฉพาะตอนใช้ |
| Thai PDF font | `apps/web/public/fonts/sarabun/` | Sarabun Regular/Bold พร้อม OFL.txt |
| Formatting | Prettier ^3.9.6 | config ใน apps/web; จัด Vue/TS ให้อ่านง่าย |

เวอร์ชันจริงของ dependencies ดู `apps/web/package.json`, `pnpm-lock.yaml`, `apps/api/go.mod` และ `go.sum` เป็นหลัก ไม่อัปเกรดระหว่าง resume โดยไม่มีเหตุจำเป็น

ใช้ Node 24/pnpm ที่มีอยู่ด้วย PATH เฉพาะ terminal:

```sh
cd /Users/kittipat/work-shop/mind-count
export PATH="$PWD/_wrx-output/tools/node/node_modules/.bin:$PWD/_wrx-output/tools/bin:/opt/homebrew/opt/go@1.25/bin:/opt/homebrew/bin:$PATH"
node --version
pnpm --version
go version
```

หากแค่เปิด Docker images ที่สร้างแล้ว ไม่จำเป็นต้องติดตั้ง Node/pnpm บน host เพิ่ม

## 6. Phase 0 ที่เสร็จแล้ว

- สร้าง monorepo tree ตาม instruction ครบ 63 required directories มีไฟล์ไม่ว่าง
- Go API และ migrator, config validation, JSON slog, pgxpool และ transaction context management
- middleware request ID, logging, recovery, CORS, rate limit พร้อม health/error contract
- `/health/live`, `/health/ready` และ Nuxt same-origin `/api/health/live`, `/api/health/ready`
- OpenAPI 3.1, Go generated Chi/types, TS generated schema, sqlc executor
- Goose baseline migration/seed ยังไม่มี users/sessions/business tables
- Nuxt shell, server-only upstream, strict TypeScript, pinned lockfiles
- Docker multi-stage images, Compose healthchecks, Makefile, CI configuration
- README ภาษาไทย, CONTRIBUTING และเอกสารโครงสร้าง
- Go race tests/lint/build, PostgreSQL testcontainers integration, codegen repeatability, Compose/runtime/browser smoke ผ่าน

รายละเอียด: [Phase 0 review](_bmad-output/implementation-artifacts/phase-0-review.md)

มี source listing เก่าที่ [_wrx-output/phase-0-full-source.md](_wrx-output/phase-0-full-source.md) ซึ่งเป็น snapshot **Phase 0 เท่านั้น** ไม่ใช่ source snapshot ล่าสุดของ quotation feature อย่าใช้ทับ source ปัจจุบัน

## 7. หน้าและเมนูปัจจุบัน

| URL | เมนู/ความสามารถ |
|---|---|
| `/` | redirect ไปใบเสนอราคา |
| `/sales/quotations` | list, search, status filter, date sort, pagination, selection, actions |
| `/sales/quotations/new` | สร้างใบเสนอราคา |
| `/sales/quotations/:id` | เปิดแก้ไขใบเสนอราคาที่บันทึกไว้ |
| `/sales/billing-notes` | ใบวางบิล — หน้าเตรียมไว้ รอรายละเอียด |
| `/sales/invoices` | ใบกำกับภาษี — หน้าเตรียมไว้ รอรายละเอียด |
| `/sales/receipts` | ใบเสร็จรับเงิน — หน้าเตรียมไว้ รอรายละเอียด |
| `/sales/cash-sales` | ขายเงินสด — หน้าเตรียมไว้ รอรายละเอียด |
| `/sales/credit-notes` | ใบลดหนี้ — หน้าเตรียมไว้ รอรายละเอียด |
| `/sales/debit-notes` | ใบเพิ่มหนี้ — หน้าเตรียมไว้ รอรายละเอียด |

เมนูใหม่ทั้ง 6 คลิกเปิดหน้าได้และ active menu ถูกต้อง ไม่ได้จำลองว่ามีระบบสร้างเอกสารจริงแล้ว

### ใบเสนอราคา: list และ actions

- ตัวอย่าง 8 เอกสาร, ลูกค้าไทย 3 ราย, สินค้าตัวอย่าง 4 รายการ
- ค้นหาเลขที่เอกสาร/ลูกค้า/โปรเจ็กต์, กรองสถานะ, เรียงวันที่, แบ่งหน้า 6 รายการ
- เลือกแถว/เลือกทั้งหมดในหน้าปัจจุบัน/ล้าง selection
- เมื่อเลือกแถวแสดงปุ่มดาวน์โหลด PDF, พิมพ์เอกสาร, พิมพ์จ่าหน้าซอง และยังส่งออก CSV ได้
- PDF หลายเอกสารรวมเป็นไฟล์เดียว เริ่มหน้าใหม่ต่อเอกสาร; ไฟล์เดียวตั้งชื่อตามเลขเอกสาร
- Dropdown สถานะ: `draft` ร่าง, `pending` รออนุมัติ, `sent` ส่งแล้ว, `accepted` อนุมัติแล้ว, `rejected` ไม่อนุมัติ, `expired` หมดอายุ
- เมนูสร้างเอกสารต่อ/แบ่งจ่าย/มัดจำจากภาพอ้างอิงแสดงไว้แต่ disabled และแจ้งว่ายังไม่เปิดใช้งาน
- เมนู ⋯: แก้ไข, พิมพ์, แชร์, ดาวน์โหลด PDF, พิมพ์จ่าหน้าซอง, สร้างซ้ำ, ลบ
- สร้างซ้ำได้ id/เลขที่เอกสารใหม่ สถานะร่าง และ draft เป็นสำเนาแยก; ไม่เปลี่ยนต้นฉบับ
- ลบมี native dialog component ให้ยืนยัน/ยกเลิก, state เปลี่ยนหลัง storage เขียนสำเร็จเท่านั้น

### ใบเสนอราคา: form และ credit

- customer: ชื่อ ที่อยู่ รหัสไปรษณีย์ เลขภาษี สาขา
- document: วันที่, เครดิต, ครบกำหนด, พนักงานขาย, THB
- details: โปรเจ็กต์, เลขอ้างอิง, description, ราคานอก/รวม VAT, คลังสินค้า
- line items: ชื่อ/รายละเอียด, จำนวน, หน่วย, ราคา, ส่วนลด %, VAT, หัก ณ ที่จ่าย, ยอดรวม
- เพิ่ม/ลบรายการ, validate, save, แก้ไข, unsaved-change guard
- หมายเหตุบนเอกสารและโน้ตภายในแยกกัน; **โน้ตภายในไม่ออก PDF/print/share**
- `creditMode = days | cash | undated`, เก็บ `creditDays` และ `dueDate`
- days พิมพ์จำนวนเต็ม 0–365 ได้; เปลี่ยนวันเอกสาร/จำนวนวันจะคำนวณ due date ใหม่
- เปลี่ยน due date เองจะคำนวณจำนวนวันกลับด้วย UTC date-only arithmetic
- cash = 0 วัน; cash/undated ซ่อน due date ทั้ง form และ print/PDF
- เปลี่ยนกลับ days จะคำนวณ due date จากจำนวนวันปัจจุบัน
- Zod เติมเฉพาะ field ที่ขาดในข้อมูลเก่า เพื่อให้ draft ที่มีเพียง date/creditDays ยังเปิดได้; ไม่เขียนทับ due date ที่แก้ไว้

### การคำนวณตัวอย่าง

- ยอดคำนวณเป็น integer satang
- ปัด gross ต่อรายการ → ส่วนลด % ต่อรายการ → แบ่งส่วนลดเอกสารจำนวนเงินตามสัดส่วน → VAT/withholding หลังลด
- โหมด inclusive แยก VAT ออกจากราคาที่กรอก; exclusive เพิ่ม VAT
- ตัวอย่างที่มี test: 2 × 1,000 บาท ลดบรรทัด 10%, ลดเอกสาร 100 บาท, VAT 7%, withholding 3% → total 1,819.00, payable 1,768.00
- เป็น convention ของ frontend demo ไม่ใช่ backend accounting engine เมื่อต่อ API ต้องให้ backend ตรวจและคำนวณซ้ำ

### PDF / print / share

- `pdfmake` lazy-loaded, embed Sarabun ที่เก็บใน project, PDF แบบ text/vector ภาษาไทย
- tables รองรับ pagination; header index column ปรับกว้างเพื่อไม่ตัดคำ “ลำดับ”
- Native print ใช้ components สำหรับพิมพ์แยกจาก UI
- พิมพ์ซอง DL 220 × 110 มม. จากชื่อลูกค้า/ที่อยู่/รหัสไปรษณีย์ หนึ่งแผ่นต่อเอกสาร
- แชร์เตรียม PDF File ใน dialog แล้วใช้ Web Share API เมื่อ browser รองรับ; ถ้าไม่รองรับมีปุ่มดาวน์โหลดเพื่อส่งต่อเอง
- ไม่แชร์ URL localhost เป็น public document link
- ยังไม่ได้ทดสอบเครื่องพิมพ์จริงหรือส่งไฟล์ไปผู้รับภายนอก ผลตรวจคือ browser print output/PDF และ file preparation

## 8. แผนที่ไฟล์ที่ใช้แก้งานต่อ

ดูรายละเอียดเพิ่มเติมใน [คู่มือ component/architecture](docs/architecture/quotations-frontend.md)

| ตำแหน่ง | หน้าที่ |
|---|---|
| `apps/web/app/constants/sales-navigation.ts` | รายชื่อเมนู/slug ทั้ง 7 |
| `apps/web/app/components/layout/SalesNavigation.vue` | sidebar, active link, เมนูมือถือ |
| `apps/web/app/layouts/default.vue` | shell หน้ารายการและเมนู |
| `apps/web/app/layouts/document.vue` | shell หน้าสร้าง/แก้ไข |
| `apps/web/app/pages/sales/[document].vue` | หน้ารองรับเมนูอีก 6 ประเภท |
| `apps/web/app/pages/sales/quotations/` | routes list/new/[id] บาง ๆ |
| `apps/web/app/assets/main.css` | theme, forms, tables, responsive และ print styles |
| `apps/web/app/components/base/AppIcon.vue` | ไอคอน SVG |
| `apps/web/app/components/base/FormField.vue` | label/error ของช่องกรอก |
| `apps/web/app/components/base/AppDropdown.vue` | dropdown Teleport/fixed ที่ไม่ถูก table overflow ตัด, keyboard/focus |
| `apps/web/app/components/base/AppDialog.vue` | native dialog และ focus handling |
| `apps/web/app/features/quotations/index.ts` | public exports ของ feature |
| `features/quotations/components/QuotationList.vue` | list orchestration, filter/page/selection |
| `QuotationListToolbar.vue`, `QuotationTable.vue` | ปุ่ม batch, search, table |
| `QuotationStatusMenu.vue`, `QuotationActionsMenu.vue` | status/row action menus |
| `QuotationEditor.vue` | ประกอบ form sections, submit/leave guard |
| `QuotationCustomerSection.vue` | ข้อมูลลูกค้า |
| `QuotationDocumentSection.vue`, `QuotationCreditField.vue` | date/credit/due date/dropdown |
| `QuotationDetailsSection.vue`, `QuotationItemsTable.vue` | รายละเอียด/line items |
| `QuotationNotesSection.vue`, `QuotationTotals.vue` | หมายเหตุและสรุปยอด |
| `QuotationPrintPreview.vue`, `QuotationPrintBatch.vue` | document/envelope print |
| `QuotationShareDialog.vue` | เตรียม PDF และแชร์/download fallback |
| `features/quotations/composables/useQuotationEditor.ts` | draft lifecycle, validation, save |
| `features/quotations/composables/useQuotationActions.ts` | PDF/print/status/duplicate/delete, busy/error state |
| `features/quotations/stores/quotations.ts` | Pinia saved records และ mutations |
| `features/quotations/services/fixtures.ts` | sample customers/products/records และ draft defaults |
| `services/calculations.ts`, `credit-terms.ts`, `format.ts` | pure arithmetic/dates/format |
| `services/storage.ts` | validated localStorage adapter |
| `services/pdf-definition.ts`, `pdf.ts` | pure PDF definition และ browser adapter |
| `services/export.ts`, `status.ts`, `actions.ts` | CSV/status labels/action definitions |
| `features/quotations/schemas/quotation.ts`, `types/index.ts` | runtime validation และ TS types |
| `apps/web/tests/unit/` | unit tests |
| `tests/e2e/` | Playwright browser scenarios |
| `apps/web/public/fonts/sarabun/` | PDF fonts/license |

แถวในตารางที่ย่อเป็น `features/quotations/...` หรือชื่อ component หมายถึงใต้ `apps/web/app/` และ feature quotations เดียวกัน

## 9. ข้อมูลที่บันทึกและสิ่งที่ยังไม่ทำ

- Key: **`mind-count:quotations:demo:v1`** ใน `localStorage`
- SSR เริ่มจาก fixtures ที่แน่นอน แล้วอ่าน localStorage หลัง mounted
- form/list/menu ใช้ readiness gating (`inert`/disabled) ก่อน hydration เพื่อไม่ให้การกดหรือกรอกหาย
- saved state เปลี่ยนหลังเขียน localStorage สำเร็จเท่านั้น ถ้า storage เต็ม/ปิด/malformed จะแสดง error และไม่ทับข้อมูลเดิม
- การเปลี่ยน port หรือ hostname เปลี่ยน origin: **`localhost:33000` กับ `127.0.0.1:33000` มี localStorage คนละชุด** ใช้ URL เดิมเพื่อเห็นข้อมูลที่ผู้ใช้กรอก
- ไฟล์ handoff นี้ **ไม่ได้ export ข้อมูล localStorage จาก browser profile จริงของผู้ใช้** และไม่ได้เป็น database backup; ปกติ browser profile เดิมยังเก็บข้อมูลหลัง restart แต่ไม่ควร clear site data
- ไม่รองรับ collaborative editing / cross-tab conflict resolution หรือซิงก์ข้อมูลข้ามเครื่อง
- ยังไม่มี quotation Go module/API/database persistence
- ยังไม่มี auth/register/login/profile/JWT/Argon2id/users-sessions implementation
- ยังไม่มี upload/signature จริง, public share link, approval flow จากผู้ใช้อื่น
- เมนูอีก 6 ประเภทมีเพียงหน้าเตรียมไว้; conversion/installment/deposit ยัง disabled
- ไม่ได้เริ่ม purchase-order module แม้ชื่อเมนูนั้นอยู่ใน screenshot อ้างอิง

## 10. ผลทดสอบล่าสุดและวิธีรัน

ผลสุดท้ายก่อนบันทึก session:

| Check | Result |
|---|---|
| Frontend ESLint | PASS, exit 0 |
| TypeScript strict | PASS, exit 0 |
| Vitest | **18 tests passed** ใน 5 files |
| Nuxt Docker production build | PASS |
| Playwright Chromium | **7 tests passed**, 3.2 วินาที |
| PDF ที่ดาวน์โหลด 2 ใบ | 2 หน้า A4, embed font ไทย, ตรวจภาพแล้ว |
| พิมพ์เอกสารที่เลือก 2 ใบ | 2 หน้า |
| พิมพ์ซอง 2 ใบ | 2 หน้า DL ไม่มีหน้าว่างเกิน |
| Sidebar 7 เมนู | คลิกได้ทุกหน้า active link ถูกต้อง |

Final web image manifest: `sha256:19bb5fd05a20688cc9bf849030593ad42ad9072ce9adbb6362359500666c3f26`

ผล runtime ข้างต้นเป็นผลที่ตรวจใน session นี้ ไม่รับรองว่า process ยังรันหลัง reboot ให้ใช้ขั้นตอนเปิดระบบในข้อ 2

คำสั่งปกติหลังตั้ง Node 24/pnpm PATH:

```sh
pnpm lint
pnpm typecheck
pnpm test
pnpm build
PLAYWRIGHT_BASE_URL=http://127.0.0.1:33000 pnpm test:e2e
```

Runner ที่ใช้ใน session ตั้ง tools/cache/browser path ให้และเก็บ logs:

```sh
node _wrx-output/tools/check.mjs web-lint
node _wrx-output/tools/check.mjs web-types
node _wrx-output/tools/check.mjs web-test
node _wrx-output/tools/check.mjs web-build
PLAYWRIGHT_BASE_URL=http://127.0.0.1:33000 node _wrx-output/tools/check.mjs e2e
```

Runner stages อื่น: `go-test`, `go-lint`, `go-build`, `integration`, `go-tidy`, `generated`, `compose-validate`, `compose-dev` โดย integration/Compose/Playwright ต้องมี Docker/browser/network permissions ตาม environment ของ session ใหม่

อย่ารัน Nuxt prepare/typecheck/build ที่แก้ `.nuxt` พร้อมกันโดยไม่จำเป็น; unit test ทำขนานกับ lint ได้ ส่วน build ใน Docker ใช้ filesystem ภายใน image

Tests ที่เพิ่ม:

- `apps/web/tests/unit/quotations.test.ts` — เงิน/ส่วนลด/VAT/withholding/rounding/validation/date
- `quotation-storage.test.ts` — roundtrip/empty/malformed/storage failure
- `quotation-credit.test.ts` — custom days/manual dates/month-leap boundaries/modes/legacy data
- `quotation-actions.test.ts` — statuses/duplicate/delete/persist failure/PDF privacy
- `tests/e2e/quotations.spec.ts` — create/calculate/save/reload/edit/print privacy/mobile
- `quotation-credit.spec.ts` — 3 credit modes/manual due date/save/reload/print
- `quotation-actions.spec.ts` — selected PDF/print/envelopes, status/share/duplicate/delete, 7 menus
- `shell.spec.ts` — page + health proxy

## 11. ปัญหาที่พบและแก้แล้ว อย่าแก้ย้อนกลับโดยไม่ตรวจ

1. **ก่อน hydration ปุ่มกดไม่ติด**: initial SSR DOM รับ click ก่อน handlers พร้อม แก้ด้วย mounted readiness/inert/disabled
2. **มือถือมีพื้นที่ล้นด้านข้าง 997px ที่ viewport 390px**: sr-only absolute labels ใน wide table หลุด scroll container แก้ `position: relative` ที่ table scroll wrappers
3. **เมนูมือถือที่ปิดยัง focus ได้**: เพิ่ม visibility hidden/visible ตาม open state
4. **ข้อมูลเก่าไม่มี creditMode/dueDate**: Zod defaults/transform เติมเฉพาะที่ขาด อย่าเปลี่ยน storage key โดยไม่วาง migration
5. **E2E reload เร็วกว่าการเปลี่ยน route**: รอ edit form/value ก่อน reload; ไม่ใช่ save failure
6. **Print test จับ heading ผิด**: getByRole ไม่รวม hidden heading ทำให้จับ heading ของเอกสารพิมพ์ แก้ตรวจ `.screen-document` โดยตรง
7. **PDF หัวตารางลำดับตัดคำ**: ขยาย index column เป็น 28 pt
8. **ซอง 2 ใบได้ 3 หน้า (หน้า A4 เปล่าต่อท้าย)**: named-page transition ผ่าน flex container แก้ print `.sales-workspace { display:block }` และ `body:has(.envelope-sheet) { page: envelope }`; เพิ่ม assertion จำนวน Page objects ใน PDF
9. **Health 502 จาก services หยุด**: เริ่ม API/Postgres เดิม ไม่เปลี่ยน business code เพื่อแก้ runtime ที่ยังไม่เปิด

Build มี warning chunk PDF ใหญ่กว่า 500 KB โดย library เป็น dynamic import แยก (~346 KB gzip เมื่อเรียกใช้) ไม่ได้ปิด warning หรือโหลดทุกหน้าโดยตั้งใจ

## 12. เอกสารและหลักฐานสำคัญ

- [README คู่มือใช้งาน/tools](README.md)
- [Frontend component guide](docs/architecture/quotations-frontend.md)
- [Phase 0 plan](_bmad-output/implementation-artifacts/phase-0-plan.md)
- [Phase 0 review](_bmad-output/implementation-artifacts/phase-0-review.md)
- [Quotation UI plan](_bmad-output/implementation-artifacts/quotations-ui-plan.md)
- [Quotation UI review](_bmad-output/implementation-artifacts/quotations-ui-review.md)
- [Credit terms record](_bmad-output/implementation-artifacts/quotation-credit-terms.md)
- [List actions and menus record](_bmad-output/implementation-artifacts/quotation-list-actions.md)
- [Final actions verification](_wrx-output/evidence/quotation-actions-verification.md)
- [Credit verification](_wrx-output/evidence/quotation-credit-verification.md)
- [Initial quotation verification](_wrx-output/evidence/quotations-final-verification.md)
- Latest logs: `_wrx-output/evidence/web-lint.log`, `web-types.log`, `web-test.log`, `e2e.log`
- Phase 0 logs: `go-test.log`, `go-lint.log`, `go-build.log`, `integration.log`, `generated.log`, `compose-smoke.json`
- Red proofs: `quotations-e2e-red.log`, `quotation-credit-before.md`, `envelopes-extra-page-before.pdf`

`_wrx-output/` อยู่ใน .gitignore แต่เป็นโฟลเดอร์บน disk เดิม จึงไม่หายเพียงเพราะ reboot อย่างไรก็ตาม log ชื่อเดิมอาจถูก runner เขียนทับในรอบถัดไป ให้ดูวันที่และ feature-specific verification report ประกอบ

## 13. ภาพอ้างอิงที่ผู้ใช้ส่ง — คัดลอกจาก temp แล้ว

ต้นฉบับเคยอยู่ใน `/var/folders/.../T/codex-clipboard-*.png` ซึ่งอาจหายหลัง reboot จึงคัดลอกครบทั้ง 6 ภาพมาที่ `docs/session-assets/2026-09-13/`

| ภาพ | สำเนาที่เก็บถาวรใน workspace |
|---|---|
| หน้ารายการใบเสนอราคาเริ่มต้น | [reference-quotation-list.png](docs/session-assets/2026-09-13/reference-quotation-list.png) |
| หน้าสร้างใบเสนอราคา | [reference-quotation-create.png](docs/session-assets/2026-09-13/reference-quotation-create.png) |
| เครดิต 3 แบบ/วันครบกำหนด | [reference-credit-options.png](docs/session-assets/2026-09-13/reference-credit-options.png) |
| เลือกแถวแล้วแสดง batch actions | [reference-selected-actions.png](docs/session-assets/2026-09-13/reference-selected-actions.png) |
| เมนูสถานะ/สร้างเอกสารต่อ | [reference-status-actions.png](docs/session-assets/2026-09-13/reference-status-actions.png) |
| เมนูจัดการแต่ละใบ | [reference-row-actions.png](docs/session-assets/2026-09-13/reference-row-actions.png) |

ภาพตัวอย่างผลงานและ PDFs ที่คัดลอกไว้ในโฟลเดอร์เดียวกัน:

- [รายการพร้อมปุ่มเมื่อเลือก](docs/session-assets/2026-09-13/quotations-selected-actions.png)
- [เมนูสถานะ](docs/session-assets/2026-09-13/quotations-status-menu.png)
- [เมนูจัดการแถว](docs/session-assets/2026-09-13/quotations-row-menu.png)
- [เมนูมือถือทั้ง 7](docs/session-assets/2026-09-13/sales-menus-mobile.png)
- [ภาพหน้าสร้างจากรอบ UI แรก](docs/session-assets/2026-09-13/quotation-create.png) — ก่อนการเพิ่มเครดิต/actions ล่าสุด
- [ภาพเครดิตหลังปรับ](docs/session-assets/2026-09-13/quotation-credit-dropdown.png)
- [PDF preview](docs/session-assets/2026-09-13/quotations-pdf-preview.png)
- [PDF ตัวอย่าง 2 ใบ](docs/session-assets/2026-09-13/quotations-selected.pdf)
- [PDF ซอง 2 ใบหลังแก้หน้าว่าง](docs/session-assets/2026-09-13/quotations-envelopes.pdf)

ภาพเป็นตัวอย่างข้อมูล demo ไม่ใช่ export เอกสารส่วนตัวที่ผู้ใช้กรอกใน browser จริง

## 14. งานถัดไปที่รอผู้ใช้

**ยังไม่มีคำสั่งรายละเอียดใหม่ที่ต้อง implement ต่อทันที** ผู้ใช้จะกลับมาจาก session ใหม่แล้วให้รายละเอียดเพิ่มเติม

- รอรายละเอียดใบวางบิล/ใบกำกับภาษี/ใบเสร็จรับเงิน/ขายเงินสด/ใบลดหนี้/ใบเพิ่มหนี้ตามลำดับที่ผู้ใช้เลือก
- หากสั่งต่อ API/ฐานข้อมูล ให้เริ่มจาก contract/schema ตาม instruction และวาง migration จาก browser demo อย่างชัดเจน
- หากสั่ง auth Phase 1 จึงเริ่ม register/login/profile ตาม original instruction
- อย่าสร้าง approval/payment/conversion workflow จากภาพเองโดยไม่มีข้อมูลเพิ่ม
- รักษาโทนสว่างและการแยก component ที่ทำไว้
- อ่านโค้ดปัจจุบันก่อนแก้ ไม่ restore ทับจาก source listing Phase 0
- ไม่ต้อง reinstall tools, ล้าง database, ล้าง localStorage, initialize Git หรือ deploy ภายนอกเพื่อ “เริ่ม session ใหม่”

## 15. ข้อความพร้อมใช้เปิด session ใหม่

```text
ทำงานต่อโปรเจกต์ /Users/kittipat/work-shop/mind-count
ให้อ่าน /Users/kittipat/work-shop/mind-count/SESSION_HANDOFF.md ก่อน
แล้วอ่าน Instruction/Markdown.md และ docs/architecture/quotations-frontend.md ประกอบ
รักษางานเดิมและข้อมูลเดิมไว้ ตอนนี้ Phase 0 และใบเสนอราคา frontend เสร็จแล้ว
มีเมนูเอกสารการขายครบ 7 รายการ อีก 6 หน้ารอรายละเอียดจากผม
อย่าเริ่ม auth หรือเอกสารประเภทอื่นเอง ให้ทำตามคำสั่งใหม่ที่ผมจะให้ต่อไป
```

สิ้นสุดบันทึก: source และเอกสารอยู่ใน workspace เดิม พร้อมกลับมาทำงานต่อหลัง reboot
