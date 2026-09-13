# สำเนาคำสั่ง AGENTS.md ที่ผู้ใช้ส่งใน session

บันทึกไว้เป็นบริบทส่งต่องาน ณ 2026-09-13 ข้อความด้านล่างมาจากผู้ใช้ ไม่ใช่การยืนยัน runtime profile/บัญชีที่ติดตั้งใน session ใหม่ ให้ตรวจ environment ของ session ใหม่ประกอบ

---

# Wrixon Script v15 Universal Kernel

Wrixon Script v15 is profile-driven. The BMAD-METHOD workflow is identical across runtime profiles; model selection only changes role routing.

## Runtime Profiles

- `codex-only`: the account-aware Codex `auto` policy handles lead, planning, implementation, TEA/R0, final review.
- `deepseek-kimi`: DeepSeek leads/plans/reviews; Kimi Code implements.
- `deepseek-codex`: DeepSeek leads/plans/reviews; Codex implements.
- `deepseek-glm-codex`: DeepSeek leads/final-reviews; GLM investigates/TEA/R0; Codex implements.
- `deepseek-glm-kimi`: DeepSeek leads/final-reviews; GLM investigates/TEA/R0; Kimi implements.

Default profile is `codex-only`. First interactive `wrx-go` shows the profile chooser; Enter keeps Codex-only. Users can switch with `wrx-profile choose` or `wrx-profile set <profile>`.

Codex model policy defaults to `auto`: Wrixon resolves the authenticated account catalog with `codex debug models`, then its local cache. Explicit model pins and `wrx-go --model <id>` are preserved. If the catalog is unavailable, Wrixon omits its model override and lets Codex use its native default. DeepSeek, GLM, and Gemini remain explicitly configured; Kimi keeps its CLI-native behavior.

## Commands

- `wrx-go`: start Wrixon Script v15.
- `wrx-go --choose`: choose profile before launch.
- `wrx-profile`: show/choose/set active profile.
- `wrx-start`: session-start chat command.
- `wrx-end`: session-end chat command.
- `wis start`, `wis go`: Wis aliases over Wrixon start/go.
- `wrx-ai`: local bridge for DeepSeek/GLM advisors.
- `wrx-runtime-smoke`: offline/live runtime validation.

## Mandatory Path Routing

Before implementation or review work, state:

```text
PATH: A | B | C
REASON: concrete criterion
EVIDENCE: concrete files/scope/behavior
MODEL ROUTE: active profile route
```

Path A: small, pattern-following, no architecture/schema/transport/public contract change.
Path B: multi-file, nuanced, user-facing, coverage gap, or new tests needed.
Path C: new subsystem, architecture change, external integration, migration, or uncertain blast radius.

## BMAD Discipline

Use BMAD artifacts under `_bmad-output/implementation-artifacts/` and runtime evidence under `_wrx-output/`. For Path B/C bug fixes, produce red-proof before implementation.

## GLM S377 Runtime

GLM advisor roles (`investigator`, `tea`, `r0`) route through Claude Code + Z.AI with read-only tools and bounded concurrency:

```bash
WRX_GLM_TRANSPORT=claude-code-zai
WRX_GLM_CLAUDE_BASE_URL=https://api.z.ai/api/anthropic
WRX_GLM_API_KEY_ENV=Z_AI_API_KEY
WRX_GLM_MAX_CONCURRENCY=2
WRX_GLM_ALLOWED_TOOLS=Read
```

No GLM advisor fallback to DeepSeek is allowed; failure must surface as a runtime/auth issue.

## Safety

Preserve unrelated user changes, never expose secrets, use focused tests/evidence before claiming completion, and keep Wrixon runtime output under `_wrx-output/`.
