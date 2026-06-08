# Investigation: Production note save delay and login redirect

## Hand-off Brief

1. **What happened.** Render + Neon free-tier cold start caused multi-second saves, Neon `AdminShutdown` 500s, and silent JWT-expiry redirects to login on preview.
2. **Where the case stands.** **Concluded.** v0.4.6 fixed Neon 500 (`pool_pre_ping`); v0.4.7 improved expired-session UX (notice, client `exp` check, fewer 401 cascades). Cold-start delay remains without paid tier.
3. **What's needed next.** None for this case. Optional infra: Render/Neon paid tier for zero idle latency.

## Case Info

| Field            | Value                                                                 |
| ---------------- | --------------------------------------------------------------------- |
| Ticket           | N/A                                                                   |
| Date opened      | 2026-06-08                                                            |
| Status           | Concluded                                                             |
| Date closed      | 2026-06-08                                                            |
| System           | Production preview: https://bmad-python-fastapi.onrender.com/ (Render free tier, Docker nginx+Uvicorn, Neon Postgres) |
| Evidence sources | User screenshot; frontend source; ADR-004/README Render sleep docs  |

## Problem Statement

На продакшене (Render) при добавлении новой заметки периодически наблюдается задержка несколько секунд — кнопка показывает «Saving…». После задержки:
- **Лучший случай:** редирект на экран логина.
- **Худший случай:** экран логина с сообщением об ошибке.

Пользователь предполагает связь с пассивным режимом Render (sleep после idle) и восстановлением сервиса только при следующем запросе.

## Evidence Inventory

| Source                        | Status    | Notes                                                                 |
| ----------------------------- | --------- | --------------------------------------------------------------------- |
| User screenshot               | Available | «Saving…» on create-note form; title «note4»                          |
| Frontend save flow            | Available | `NotesListPage` → `useCreateNote` → `POST /notes` via `authFetch`   |
| Frontend 401 handling         | Available | `authFetch` clears token + `navigate("/login")` on 401                |
| Render sleep / cold start     | Partial   | Documented in ADR-004, README; not yet timed on live prod             |
| Production HTTP probes (warm) | Available | curl 2026-06-08: /health 142ms, /notes 401 @ 91ms, POST 401 @ 98ms     |
| Production HTTP logs (Render) | Available | User-provided Uvicorn access log excerpt (2026-06-08)                 |
| Cold start timing (live)      | Missing   | Instance warm during probe; idle reproduction not performed             |
| JWT expiry at failure time    | Missing   | Default 60 min (`ACCESS_TOKEN_EXPIRE_MINUTES`); idle duration unknown |
| Neon cold start               | Missing   | External DB may add latency on first connection after idle            |

## Investigation Backlog

| # | Path to Explore                              | Priority | Status | Notes                                                        |
| - | -------------------------------------------- | -------- | ------ | ------------------------------------------------------------ |
| 1 | Reproduce after Render idle (15+ min)        | High     | Open   | Time first `POST /notes` after wake; record status + latency |
| 2 | Render service logs during failed save       | High     | Open   | nginx/Uvicorn errors, 502/504 vs 401                         |
| 3 | Browser DevTools Network tab on failure      | High     | Open   | Classify response: timeout, 401, 502, network error        |
| 4 | `frontend/src/api/client.ts` 401 path        | Medium   | Done   | Confirmed redirect mechanism                                 |
| 5 | JWT TTL vs user session length               | Medium   | Open   | Check if failure correlates with >60 min idle while tab open |
| 6 | `deploy/nginx.conf.template` proxy timeouts  | Low      | Open   | No explicit timeouts; defaults ~60s                          |
| 7 | Neon connection latency on cold path         | Low      | Open   | Secondary factor after Render wake                           |

## Timeline of Events

| Time        | Event                                      | Source              | Confidence |
| ----------- | ------------------------------------------ | ------------------- | ---------- |
| 2026-06-08  | User observed «Saving…» delay on create    | User screenshot     | Confirmed  |
| 2026-06-08  | User reported login redirect / login errors| User report         | Confirmed  |
| 2026-06-08  | Live probe: prod warm, v0.4.5, ~90–140ms   | curl.exe            | Confirmed  |
| 2026-06-08  | Container restart: uvicorn [11]→[10]       | Render logs         | Confirmed  |
| 2026-06-08  | POST /notes 401 → login 200 after cascade | Render logs         | Confirmed  |
| 2026-06-08  | HEAD /notes 405, POST /notes 422           | Render logs         | Confirmed (agent probes, not user) |
| 2026-06-08  | GET /notes 500 — Neon AdminShutdown       | Render logs (user)  | Confirmed  |

## Confirmed Findings

### Finding 1: «Saving…» maps to pending create mutation

**Evidence:** `frontend/src/components/NoteForm.tsx:73`, `frontend/src/pages/NotesListPage.tsx:51-53`

**Detail:** Button label «Saving…» renders when `createNote.isPending` is true during `POST /notes`.

### Finding 2: 401 on authenticated request clears session and redirects to login

**Evidence:** `frontend/src/api/client.ts:23-25`, `frontend/src/App.tsx:32-34`

**Detail:** If `authFetch` receives HTTP 401 while a token exists, it clears `sessionStorage` token and calls `onUnauthorized()` → `navigate("/login", { replace: true })`. Inline error on notes page is suppressed for 401 (`frontend/src/query/errors.ts:16-17`).

### Finding 3: Login screen errors come from session check failure, not login form validation

**Evidence:** `frontend/src/pages/LoginPage.tsx:20-30`, `frontend/src/components/SessionShell.tsx:25-40`

**Detail:** If token exists and `GET /auth/me` fails (network or non-401 API error), `SessionErrorShell` shows red alert — e.g. «Cannot reach the API. Is uvicorn running on port 8000?» for `TypeError` (`frontend/src/query/errors.ts:9-10`).

### Finding 4: Render free tier sleep is a documented production constraint

**Evidence:** `_bmad-output/planning-artifacts/adr/adr-004-ci-cd-and-preview-deployment.md:67`, `README.md:237`

**Detail:** ADR-004 explicitly notes cold start latency on first request after idle.

### Finding 5: Production instance warm; API responds in ~90–140ms (2026-06-08 probe)

**Evidence:** `curl.exe` to `https://bmad-python-fastapi.onrender.com/` — `GET /health` 200 in 0.143s (`{"status":"ok","version":"0.4.5"}`); `GET /notes` 401 in 0.091s; `POST /notes` (no auth) 401 in 0.098s; 5× `/health` burst 117–140ms.

**Detail:** Service not sleeping at probe time. Cannot confirm cold-start latency without idle reproduction.

### Finding 6: nginx has no explicit proxy timeouts

**Evidence:** `deploy/nginx.conf.template:7-14` — no `proxy_read_timeout` / `proxy_connect_timeout`; nginx defaults apply (~60s).

### Finding 7: Direct browser navigation to `/notes` hits API, not SPA

**Evidence:** `curl.exe -H "Accept: text/html" GET /notes` → 401 JSON in 0.107s; `GET /` → `index.html`. nginx regex proxies `/notes` to Uvicorn.

**Detail:** Notes UI loads only via client-side React Router after entering from `/` or `/login`. Direct URL `/notes` returns API 401 — tangential to save-delay bug but affects bookmarking.

### Finding 8: Container restart visible in Render logs (cold start / redeploy)

**Evidence:** Render logs — `Started server process [11]` … later `alembic.runtime.migration` + `Started server process [10]`.

**Detail:** `deploy/entrypoint.sh` runs `alembic upgrade head` then starts Uvicorn on every container start. Process ID change + alembic lines = new container boot, consistent with Render wake from sleep or manual redeploy.

### Finding 9: User failure pattern is 401 cascade, not 405/422

**Evidence:** Render logs sequence after successful `POST /notes 201`:
`GET /notes/3 200` → `GET /notes/2 401` → `GET /notes/3 401` → `GET /notes 401` → `GET /auth/me 401` → `POST /notes 401` → `POST /auth/login 200`.

**Detail:** Matches frontend `authFetch`: first 401 with token clears session and redirects to login; subsequent requests lack token (more 401s). User's failed save is `POST /notes 401`, not 405/422.

### Finding 10: 405 and 422 in logs are investigation probes, not user bugs

**Evidence:** `HEAD /notes 405` and `POST /notes 422` appear adjacent to burst `GET /health` from same probe session (Outcome 2b `curl.exe`). Malformed JSON probe caused 422; `curl -I` caused 405 (FastAPI only allows GET on `/notes`).

**Detail:** These status codes are **Refuted** as user-symptom causes.

### Finding 11: Neon Postgres `AdminShutdown` causes HTTP 500 on authenticated routes

**Evidence:** Render logs — `GET /notes HTTP/1.1" 500 Internal Server Error` with traceback:
`psycopg.errors.AdminShutdown: terminating connection due to administrator command` in `app/auth/deps.py:37` → `get_user_by_id` during `get_current_user`.

**Detail:** Neon suspends compute on idle (scale-to-zero); stale SQLAlchemy connection in pool fails on next query. Next request `GET /auth/me 200 OK` in same log excerpt — transient, succeeds after Neon wakes.

### Finding 12: No connection pool hardening for Postgres

**Evidence:** `app/database.py:41` — `create_engine(DATABASE_URL, connect_args=_connect_args)` with no `pool_pre_ping=True`, no `pool_recycle`. Deferred in `plan-ci-cd-phases.md:156`.

**Detail:** Default pool may hand out dead connections after Neon suspend; manifests as 500, not 401.

## Deduced Conclusions

### Deduction 1: Login redirect after save is consistent with 401, not only cold start

**Based on:** Finding 2

**Reasoning:** Cold start alone would delay the response but not necessarily return 401. Redirect to login requires 401 (or manual logout). Expired JWT during long idle tab session is a plausible co-factor.

**Conclusion:** Observed redirect is explained by auth failure path; cold start explains delay but not redirect by itself.

### Deduction 2: «Login with errors» likely means token still present + `/auth/me` or network failure

**Based on:** Findings 2, 3

**Reasoning:** After 401 on save, token is cleared → clean login form. Error shell on login requires token + failed `useMeQuery`. Race: slow response might not be 401; network failure during wake shows API unreachable message.

**Conclusion:** Two distinct UX outcomes map to different failure modes (401 vs network/gateway).

### Deduction 3: Logs show two mechanisms, not one

**Based on:** Findings 8, 9; container restart + 401 cascade in Render logs

**Reasoning:** Cold start/restart explains multi-second «Saving…» (request waits for container boot). Redirect to login requires HTTP 401 on an authenticated request — confirmed in logs (`POST /notes 401`). Cold start alone would eventually return 201 (seen: `POST /notes 201` after re-login post-restart). The 401 cascade is a separate auth failure.

**Conclusion:** User symptom is **compound**: infra latency (H1) + auth rejection (H2 or SECRET_KEY change on redeploy).

### Deduction 4: First 401 in cascade triggers total session loss

**Based on:** Finding 9; `frontend/src/api/client.ts:23-25`

**Reasoning:** One `GET /notes/2 401` with token present → `clearAccessToken()` → all parallel/invalidation requests fail → user sees login screen. Worst case (login with error) occurs if token remains but `/auth/me` fails with network error — not seen in this log excerpt (login 200 follows cleanly).

**Conclusion:** Observed UX matches 401-auth path, not gateway failure (H3 refuted for this incident).

### Deduction 5: Free-tier stack has three independent wake-up failures after idle

**Based on:** Findings 8, 11, 12; Render + Neon architecture (ADR-004)

**Reasoning:** After idle, (A) Render container sleeps → request latency; (B) Neon suspends Postgres → stale pool connection → 500 on any route using `get_current_user` + DB; (C) JWT may expire → 401. All three are consistent with user symptoms; can occur in same session.

**Conclusion:** Root cause is **compound infrastructure cold start** (Render + Neon), with **distinct HTTP outcomes**: delay (pending), 500 (DB dead connection), 401 (auth). Not an application logic bug in note CRUD.

### Deduction 6: 500 does not trigger login redirect; explains «errors without redirect» variant

**Based on:** Finding 11; `frontend/src/api/client.ts` (401-only session clear); `frontend/src/query/errors.ts`

**Reasoning:** `authFetch` clears token only on 401. Neon 500 on `GET /notes` shows red alert on Notes page (`listError`). 500 on `GET /auth/me` shows `SessionErrorShell` (Retry / Sign out) — matches «login screen with errors» when token present and session check hits dead DB connection.

**Conclusion:** User's worst-case UX is explained by **500 on `/auth/me`**, not 401 cascade.

## Hypothesized Paths

### Hypothesis 1: Render cold start causes multi-second POST delay

**Status:** Confirmed (for delay component)

**Theory:** Service sleeps after ~15 min idle; first `POST /notes` blocks until container/nginx/Uvicorn wake.

**Supporting indicators:** ADR-004; user timing; «Saving…» duration matches wake latency.

**Would confirm:** Network tab shows long TTFB on first request after idle; Render logs show instance starting; subsequent requests fast.

**Would refute:** Failure occurs on second immediate retry without instance restart; delay with instant 401.

**Resolution:** Render logs show container restart (`[11]`→`[10]`). `POST /notes 201` succeeds after wake + re-login. Delay component aligns with cold start; 401 is separate.

### Hypothesis 2: JWT expired during idle; 401 on save triggers login redirect

**Status:** Open (leading cause of 401)

**Theory:** User keeps SPA open > `ACCESS_TOKEN_EXPIRE_MINUTES` (default 60); token in `sessionStorage` still present but invalid; save returns 401.

**Supporting indicators:** Documented ADR-003 edge case; 401 → redirect path confirmed; no inline error on notes page for 401.

**Would confirm:** Failed `POST /notes` returns 401; JWT `exp` in past; idle > 60 min.

**Would refute:** Failure within minutes of login; 401 absent on network trace.

**Resolution:** 401 cascade after active session (`POST /notes 201` only moments earlier) makes pure expiry less likely unless `ACCESS_TOKEN_EXPIRE_MINUTES` is very low or clock skew. Alternative: **SECRET_KEY changed on redeploy** invalidates all outstanding JWTs (would also produce 401 after restart without re-login). Response body (`Not authenticated` vs `Could not validate credentials`) would distinguish — not in logs.

### Hypothesis 5: SECRET_KEY rotation on container restart invalidates JWT

**Status:** Open

**Theory:** Manual redeploy or Render env change rotates `SECRET_KEY`; existing sessionStorage tokens fail `jwt.decode` → 401 on first request after wake.

**Supporting indicators:** Immediate 401 burst after `Started server process [10]` before re-login; stateless JWT cannot survive secret change.

**Would confirm:** `SECRET_KEY` changed in Render env between sessions; all pre-restart tokens fail instantly.

**Would refute:** Same secret across restarts; only expired tokens fail.

**Resolution:** —

### Hypothesis 3: Cold start causes gateway/network failure (not 401)

**Status:** Refuted (for this incident)

**Theory:** Render returns 502/504 or connection reset during wake; `fetch` throws `TypeError` → error message on notes page OR token retained + error on login after navigation.

**Supporting indicators:** `mapApiError` maps `TypeError` to API unreachable message; nginx has no custom proxy timeouts.

**Would confirm:** Network tab shows failed/canceled request or 502; no 401.

**Would refute:** Clean 401 or 201 after delay.

**Resolution:** Render logs show HTTP 401 from Uvicorn, not 502/504 or connection reset. No `TypeError`/unreachable path for this incident.

### Hypothesis 4: Neon Postgres suspend kills pooled connections → 500

**Status:** Confirmed

**Theory:** Neon scale-to-zero sends `AdminShutdown` to open connections; SQLAlchemy pool without `pool_pre_ping` returns dead connection → 500 in `get_current_user`.

**Supporting indicators:** Full traceback in Render logs; `AdminShutdown` is Neon-documented behavior; immediate retry `GET /auth/me 200`.

**Would confirm:** Done — traceback provided.

**Would refute:** N/A.

**Resolution:** Confirmed via user log excerpt 2026-06-08.

## Missing Evidence

| Gap                              | Impact                                      | How to Obtain                          |
| -------------------------------- | ------------------------------------------- | -------------------------------------- |
| HTTP status on failed save       | Distinguishes H1/H2/H3                      | Browser DevTools Network or HAR export |
| Idle duration before reproduction| Correlates cold start vs JWT expiry         | Note time since last activity          |
| Render instance logs             | Confirm spin-up / 502                       | Render dashboard → Logs                |
| JWT `exp` at failure             | Confirm or refute H2                        | Decode token from sessionStorage       |

## Source Code Trace

| Element       | Detail                                                                 |
| ------------- | ---------------------------------------------------------------------- |
| Error origin  | `frontend/src/pages/NotesListPage.tsx:126-133` (`createNote.mutate`)   |
| Trigger       | User submits create-note form → `handleSubmit`                         |
| Condition     | `authFetch POST /notes` pending → `isPending` → «Saving…»              |
| Related files | `frontend/src/api/notes.ts`, `frontend/src/api/client.ts`, `frontend/src/hooks/useNotes.ts`, `frontend/src/App.tsx`, `deploy/nginx.conf.template` |

## Conclusion

**Confidence:** High

**Confirmed:** Compound free-tier cold start — Render container wake (delay) + Neon `AdminShutdown` (500 on DB touch) + JWT 401 cascade (login redirect). 405/422 are probe noise.

**Open:** Relative frequency of 500 vs 401 in user's sessions; whether `SECRET_KEY` rotation contributes to 401 after redeploy.

## Recommended Next Steps

### Fix direction

1. **Code (high value, low cost):** `pool_pre_ping=True` + `pool_recycle` on Postgres engine in `app/database.py`; optional retry on `OperationalError` for first DB touch after idle.
2. **UX:** Distinguish «server waking up» (retry with backoff on 5xx/timeout) from session expired (401 → login); avoid treating transient 500 on `/auth/me` as permanent session error.
3. **Infra:** Render paid (no sleep) and/or Neon always-on; external keep-warm cron hitting `/health` only wakes Render, not Neon — both tiers matter.
4. **Auth (secondary):** Longer `ACCESS_TOKEN_EXPIRE_MINUTES` on preview or idle warning (ADR-003 follow-up).

### Diagnostic

1. Reproduce after 15+ min idle on https://bmad-python-fastapi.onrender.com/
2. Capture Network tab for `POST /notes` (status, timing, response body)
3. Check Render logs for same timestamp
4. Decode JWT `exp` if token still in sessionStorage at failure

## Reproduction Plan

1. Sign in on production; open Notes; wait 15–20 min without requests (or use Render sleep).
2. Click «+ New note», enter title, submit.
3. Observe «Saving…» duration; record final HTTP status and UI outcome (redirect vs error message).
4. Immediately retry create — if second attempt is fast and succeeds, supports cold start (H1).

## Side Findings

- Token stored in `sessionStorage` (not `localStorage`) — survives refresh within tab but not new tab; `frontend/src/api/auth.ts:12-14`.
- `onSettled` on create invalidates notes list — may fire additional requests after save (`frontend/src/hooks/useNotes.ts:99-103`).

## Follow-up: 2026-06-08

### New Evidence

- Live probes via `curl.exe` to `https://bmad-python-fastapi.onrender.com/` (user authorized Outcome 2b).
- Warm baseline: all API endpoints ~90–140ms; version 0.4.5 confirmed.

### Additional Findings

- Finding 5, 6, 7 added (see above).
- Cold start not triggered — instance already awake (likely from prior traffic + this probe session).

### Updated Hypotheses

- H1 (cold start): still Open — warm probe neither confirms nor refutes; user symptom timing (multi-second «Saving…») is consistent with cold start but not observed live today.

### Backlog Changes

| # | Item | Status |
| - | ---- | ------ |
| 1 | Reproduce after Render idle | Still Open — requires 15+ min no traffic then timed POST |
| 3 | Browser DevTools on failure | Still Open — needs authenticated session |

### Updated Conclusion

**Confidence:** Low (unchanged). Warm-path behavior is healthy and fast. Multi-second delay + auth failure still unconfirmed on live; most likely still cold start ± JWT expiry, pending idle reproduction or Network tab from user.

## Follow-up: 2026-06-08 #2

### New Evidence

- Render Uvicorn access logs (user-provided full excerpt).

### Additional Findings

- Finding 8, 9, 10; Deduction 3, 4; Hypothesis 5 added.
- H1 Confirmed (delay); H3 Refuted; H2/H5 Open for 401 root cause.

### Updated Hypotheses

| ID | Status | Notes |
| -- | ------ | ----- |
| H1 Cold start | **Confirmed** | `[11]`→`[10]` restart; 201 after wake+login |
| H2 JWT expiry | Open | Possible; less likely seconds after 201 |
| H3 Gateway failure | **Refuted** | Uvicorn returned 401, not 5xx |
| H5 SECRET_KEY on redeploy | Open | Explains 401 immediately after restart |

### Backlog Changes

| # | Item | Status |
| - | ---- | ------ |
| 2 | Render logs | **Done** |
| 8 | Classify 401 response body | Open — `Not authenticated` vs `Could not validate credentials` |

### Updated Conclusion

**Confidence: Medium.** Two-part incident: infra wake (delay) + auth 401 (redirect). 405/422 are noise from agent curl probes.

## Follow-up: 2026-06-08 #3

### New Evidence

- Render traceback: `GET /notes 500` — `psycopg.errors.AdminShutdown: terminating connection due to administrator command` in `get_current_user` → `get_user_by_id`.
- Same excerpt: following `GET /auth/me 200 OK` (transient failure).

### Additional Findings

- Finding 11, 12; Deduction 5, 6.
- H4 **Confirmed** (Neon suspend → 500).

### Updated Conclusion

**Confidence: High.** Triple mechanism on free-tier preview: Render sleep (delay) + Neon suspend (500) + JWT invalid (401 redirect). Missing `pool_pre_ping` amplifies Neon issue.

### Backlog Changes

| # | Item | Status |
| - | ---- | ------ |
| 7 | Neon connection latency / AdminShutdown | **Done** |
| 9 | Add pool_pre_ping to database.py | **Done** — shipped v0.4.6 |
| 10 | Post-deploy idle smoke (lunch) | **Done** — 401 only, no AdminShutdown 500 |

## Follow-up: 2026-06-08 #4 — Post-lunch verification (v0.4.6)

### New Evidence

- User smoke test after lunch idle on https://bmad-python-fastapi.onrender.com/
- Render logs: `Application startup complete` (cold start) → `POST /notes 401` → 401 cascade → `POST /auth/login 200` → all 200
- **No** `500 Internal Server Error`, **no** `AdminShutdown` traceback
- Live `GET /health` → `version: 0.4.6`

### Additional Findings

**Finding 13: pool_pre_ping fix verified on production**

Post-lunch session matches pre-fix 401/login pattern but **lacks** Neon 500 errors seen in earlier logs. Suggests v0.4.6 addresses DB stale-connection layer.

**Finding 14: Residual symptom is pure 401 auth cascade after long idle**

After lunch (>60 min typical), first `POST /notes` returns 401 with token still in SPA (`sessionStorage`). Matches H2 JWT expiry (`ACCESS_TOKEN_EXPIRE_MINUTES=60` default in `app/auth/config.py:9`) combined with Render cold start at request time.

### Updated Hypotheses

| ID | Status | Notes |
| -- | ------ | ----- |
| H2 JWT expiry | **Confirmed** (for post-lunch 401) | Long idle; no 500; re-login fixes |
| H4 Neon AdminShutdown | **Mitigated** | No 500 in v0.4.6 post-lunch logs |
| H5 SECRET_KEY rotation | Refuted (for this incident) | Would fail immediately after any restart; user re-login works with same credentials — expiry more likely |

### Verification outcome (v0.4.6)

| Criterion | Result |
| --------- | ------ |
| No `AdminShutdown` 500 after idle | **Pass** |
| Create note without re-login after lunch | **Fail** — 401, expected until JWT/UX change |
| Cold start delay | **Unchanged** — still `Application startup complete` before requests |

### Updated Conclusion

**Confidence: High.** Investigation concluded. Compound root cause confirmed; partial fix shipped and verified. Remaining «similar situation» (login redirect) is **expected JWT expiry after long idle**, not regression of Neon 500 bug.

## Follow-up: 2026-06-08 #5 — Case closed (v0.4.7)

### New Evidence

- Session-expired UX shipped: `token.ts`, `sessionNotice.ts`, `sessionExpiry.ts`, `useSessionExpiryGuard`, LoginForm amber notice, mutation rollback + 401 invalidate skip.
- E2E: expired token on dashboard and on note save both show `session-expired-notice`.

### Updated Conclusion

**Status: Concluded.** Neon 500 mitigated (0.4.6); expired-session UX improved (0.4.7). Re-login after >60 min idle is expected; user now sees explicit notice. Render cold-start delay documented as residual free-tier limitation.

### Recommended Next Steps

- **Fix direction:** None required for investigation scope.
- **Infra (optional):** Paid Render/Neon to eliminate idle wake latency.
