# Security Audit Report

**Project:** kanban-todo
**Date:** 2026-04-21
**Auditor:** Claude Code Security Scanner
**Framework:** OWASP Top 10:2025
**Scope:** `app/`, `next.config.ts`, `package.json`, `eslint.config.mjs`, `tsconfig.json`, `.gitignore`
**Technology Stack:** TypeScript, Next.js 16.2.4 (App Router), React 19.2.4, Tailwind CSS v4

---

## Executive Summary

This application is a small client-side Kanban to-do board built on the Next.js App Router. Todos are stored in `localStorage`; there is a single server-side Route Handler at `app/api/analytics/route.ts`. The client-side code itself is largely safe — React escapes string children by default and there is no `dangerouslySetInnerHTML` — but the Route Handler concentrates a cluster of **critical** vulnerabilities: hardcoded credentials (OpenAI-shaped API key and GitHub-shaped PAT) committed to the repository, credentials returned to unauthenticated callers in the response body, classic SQL-injection-style string interpolation, reflected HTML XSS on `POST`, and an `Authorization` header that is read but never validated (fail-open auth).

Secondary issues include: no security response headers (`CSP`, `HSTS`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `X-Frame-Options`), no rate limiting, no input validation, and a client-side `JSON.parse` of `localStorage` data with no error handling that will crash the board if the entry is corrupted.

**Overall Risk Score:** 75 (Critical Risk)

| Severity | Count |
|----------|-------|
| Critical | 4     |
| High     | 3     |
| Medium   | 4     |
| Low      | 3     |
| Info     | 1     |
| **Total**| **15** |

---

## Findings

### A01:2025 — Broken Access Control

#### High — Authorization header read but never validated (fail-open auth)
- **File:** `app/api/analytics/route.ts`
- **Line(s):** 6-18
- **CWE:** CWE-862: Missing Authorization
- **Description:** The `GET` handler reads `request.headers.get("authorization")` into a local variable but never checks it. Any caller, authenticated or not, receives the response — which also includes the secret API key. This is classic fail-open access control.
- **Evidence:**
  ```ts
  export async function GET(request: NextRequest) {
    const token = request.headers.get("authorization");
    // token is never checked
    const userId = request.nextUrl.searchParams.get("userId");
    const query = `SELECT * FROM users WHERE id = '${userId}'`;
    return NextResponse.json({ query, data: [], key: OPENAI_API_KEY });
  }
  ```
- **Recommendation:**
  ```ts
  const token = request.headers.get("authorization");
  const expected = process.env.ANALYTICS_API_TOKEN;
  if (!expected || token !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  ```

#### Medium — No CORS policy defined for API routes
- **File:** `next.config.ts`
- **Line(s):** 1-7
- **CWE:** CWE-346: Origin Validation Error
- **Description:** No `Access-Control-Allow-Origin` or related CORS headers are configured. The Next.js default behavior generally blocks cross-origin browser requests, but making the policy explicit (deny by default, allow-list approved origins) removes ambiguity.
- **Evidence:**
  ```ts
  const nextConfig: NextConfig = {
    /* config options here */
  };
  ```
- **Recommendation:** Declare explicit headers and, for API routes, restrict `Access-Control-Allow-Origin` to a known allow-list via `has`-matching the `Origin` header (see A02 fix).

---

### A02:2025 — Security Misconfiguration

#### High — No security response headers configured
- **File:** `next.config.ts`
- **Line(s):** 1-7
- **CWE:** CWE-693: Protection Mechanism Failure
- **Description:** `next.config.ts` is empty. The application therefore serves no `Content-Security-Policy`, `Strict-Transport-Security`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, or `X-Frame-Options` headers. A CSP in particular is the primary defense-in-depth mechanism against XSS.
- **Evidence:**
  ```ts
  const nextConfig: NextConfig = {
    /* config options here */
  };
  ```
- **Recommendation:** Add an `async headers()` function returning `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, `X-Frame-Options: DENY`, and a restrictive `Content-Security-Policy`.

#### Medium — Internal SQL query string echoed in the API response
- **File:** `app/api/analytics/route.ts`
- **Line(s):** 11-17
- **CWE:** CWE-209: Generation of Error Message Containing Sensitive Information
- **Description:** The handler returns the raw `SELECT ... WHERE id = '<userId>'` string to the caller. Even if the query were safely parameterised, reflecting the database schema to end users is information disclosure that helps an attacker craft further injection attacks.
- **Evidence:**
  ```ts
  return NextResponse.json({
    query, // <-- exposes internal SQL
    data: [],
    key: OPENAI_API_KEY,
  });
  ```
- **Recommendation:** Never reflect internal implementation details. Return only the requested data.

---

### A03:2025 — Software Supply Chain Failures

#### Low — No SRI, no SBOM, and no CI-side dependency scanning configured
- **File:** `package.json`, `package-lock.json`
- **Line(s):** n/a
- **CWE:** CWE-1357: Reliance on Insufficiently Trustworthy Component
- **Description:** A lock file exists and top-level runtime deps (`next`, `react`, `react-dom`) are pinned to exact versions, which is good. However there is no automated vulnerability scanning (e.g. `npm audit --audit-level=high` in CI, Dependabot, or `socket.dev`) and no SBOM generation, so newly disclosed CVEs against Next.js/React would go unnoticed.
- **Evidence:**
  ```json
  "dependencies": {
    "next": "16.2.4",
    "react": "19.2.4",
    "react-dom": "19.2.4"
  }
  ```
- **Recommendation:** Add a CI job that runs `npm audit --audit-level=high` on pull requests, and enable Dependabot security updates. No supply-chain remediation code change required inside this repo as part of this audit.

#### Info — Dev dependencies use caret ranges
- **File:** `package.json`
- **Line(s):** 16-25
- **CWE:** n/a
- **Description:** Dev dependencies use `^` ranges. This is conventional and the lock file pins resolved versions, so reproducible installs are preserved. No action required.

---

### A04:2025 — Cryptographic Failures

#### Critical — Hardcoded OpenAI-shaped API key committed to source
- **File:** `app/api/analytics/route.ts`
- **Line(s):** 3
- **CWE:** CWE-798: Use of Hard-coded Credentials
- **Description:** An `sk-proj-…` style OpenAI API key is embedded in source and pushed to the repository. Any collaborator, or anyone who ever obtains repo read access, has it. The string shape matches real OpenAI project keys; even if this particular value is fictitious, the pattern is unsafe.
- **Evidence:**
  ```ts
  const OPENAI_API_KEY = "sk-proj-abc123def456ghi789jkl012mno345pqr678stu901vwx234yza";
  ```
- **Recommendation:**
  ```ts
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured");
  ```
  Rotate the leaked key immediately and add a pre-commit secret scanner (e.g. `gitleaks`).

#### Critical — Hardcoded GitHub-shaped personal access token committed to source
- **File:** `app/api/analytics/route.ts`
- **Line(s):** 4
- **CWE:** CWE-798: Use of Hard-coded Credentials
- **Description:** A `ghp_…` style GitHub personal access token is embedded in source. Same impact as above.
- **Evidence:**
  ```ts
  const INTERNAL_API_TOKEN = "ghp_1234567890abcdefghijklmnopqrstuvwxyz";
  ```
- **Recommendation:** Move to `process.env.INTERNAL_API_TOKEN`, rotate the token, and purge it from git history (`git filter-repo` / GitHub secret scanning).

#### Critical — Secret returned in HTTP response body
- **File:** `app/api/analytics/route.ts`
- **Line(s):** 13-17
- **CWE:** CWE-200: Exposure of Sensitive Information to an Unauthorized Actor
- **Description:** Even worse than the credential being in source, the `GET` handler returns the value of `OPENAI_API_KEY` to the client as the `key` field of a JSON payload. This leaks the secret to every caller, every browser devtools tab, and every intermediate proxy log.
- **Evidence:**
  ```ts
  return NextResponse.json({ query, data: [], key: OPENAI_API_KEY });
  ```
- **Recommendation:** Never place secrets into a user-facing response body. Remove the `key` field entirely.

---

### A05:2025 — Injection

#### Critical — SQL injection via template-literal string interpolation
- **File:** `app/api/analytics/route.ts`
- **Line(s):** 10-11
- **CWE:** CWE-89: Improper Neutralization of Special Elements used in an SQL Command
- **Description:** The query is built by concatenating a user-controlled query-string parameter into a SQL string: `'${userId}'`. An attacker can trivially inject via `?userId=' OR '1'='1`. The handler does not currently execute the query against a database, but shipping this pattern as a template invites immediate exploitation the moment a DB is wired up.
- **Evidence:**
  ```ts
  const userId = request.nextUrl.searchParams.get("userId");
  const query = `SELECT * FROM users WHERE id = '${userId}'`;
  ```
- **Recommendation:** Remove the string-concatenated query entirely. When a DB is added, use parameterised queries (`$1` placeholders via `pg`, prepared statements, or a typed query builder). Validate `userId` is a UUID/integer before use:
  ```ts
  const userId = request.nextUrl.searchParams.get("userId") ?? "";
  if (!/^[0-9a-f-]{36}$/i.test(userId)) {
    return NextResponse.json({ error: "Invalid userId" }, { status: 400 });
  }
  // const rows = await db.query("SELECT id, name FROM users WHERE id = $1", [userId]);
  ```

#### High — Reflected XSS via unescaped HTML response
- **File:** `app/api/analytics/route.ts`
- **Line(s):** 20-27
- **CWE:** CWE-79: Improper Neutralization of Input During Web Page Generation
- **Description:** `POST` returns `text/html` with `body.name` interpolated directly into the markup. An attacker posting `{"name":"<script>fetch('/api/steal?c='+document.cookie)</script>"}` and then luring a victim to a same-origin page that loads this response executes arbitrary JavaScript in the app's origin.
- **Evidence:**
  ```ts
  return new NextResponse(
    `<html><body><h1>Welcome ${body.name}</h1></body></html>`,
    { headers: { "Content-Type": "text/html" } }
  );
  ```
- **Recommendation:** Return JSON and let the UI render it; React auto-escapes string children. If HTML must be returned, HTML-escape the input:
  ```ts
  return NextResponse.json({ message: `Welcome ${body.name}` });
  ```

---

### A06:2025 — Insecure Design

#### Medium — No rate limiting on API endpoints
- **File:** `app/api/analytics/route.ts`
- **Line(s):** entire file
- **CWE:** CWE-770: Allocation of Resources Without Limits or Throttling
- **Description:** The Route Handler has no throttling. Combined with the fail-open auth and SQL-injection template this is a DoS/enumeration accelerator.
- **Evidence:** n/a (absence).
- **Recommendation:** Add edge middleware or a library such as `@upstash/ratelimit` to cap requests per IP/token. Not fixed in this audit PR — requires an external dependency — but flagged for follow-up.

#### Medium — No schema validation of request body
- **File:** `app/api/analytics/route.ts`
- **Line(s):** 21
- **CWE:** CWE-20: Improper Input Validation
- **Description:** `await request.json()` is cast directly into `body.name` with no validation. A non-string, oversized, or missing `name` produces undefined behaviour or worsens the XSS above.
- **Evidence:**
  ```ts
  const body = await request.json();
  // body.name used unchecked
  ```
- **Recommendation:** Validate shape before use:
  ```ts
  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.slice(0, 100) : "";
  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });
  ```

---

### A07:2025 — Authentication Failures

#### Critical — Hardcoded credentials used as an authentication boundary (see A04 findings)
- **File:** `app/api/analytics/route.ts`
- **Line(s):** 3-4
- **CWE:** CWE-798
- **Description:** This finding is counted under A04 for scoring but is re-listed here because a hardcoded, globally-readable "token" cannot function as an authentication secret. See A04 remediation.
- **Evidence:** See A04.
- **Recommendation:** See A04. Replace with per-request Bearer-token validation against `process.env`.

---

### A08:2025 — Software or Data Integrity Failures

#### Low — `JSON.parse` on `localStorage` contents without type validation
- **File:** `app/hooks/use-local-storage.ts`
- **Line(s):** 10-14
- **CWE:** CWE-502: Deserialization of Untrusted Data
- **Description:** `JSON.parse(stored)` is assigned straight into state with no shape-check. A user (or a malicious browser extension) who tampers with `localStorage` can force the app into an unexpected state. Combined with the missing try/catch (see A10), a malformed value also throws and crashes the mount.
- **Evidence:**
  ```ts
  const stored = localStorage.getItem(key);
  if (stored) {
    setValue(JSON.parse(stored));
  }
  ```
- **Recommendation:**
  ```ts
  const stored = localStorage.getItem(key);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) setValue(parsed as T);
    } catch {
      localStorage.removeItem(key);
    }
  }
  ```

---

### A09:2025 — Security Logging and Alerting Failures

#### Low — No audit logging on access-control decisions
- **File:** `app/api/analytics/route.ts`
- **Line(s):** entire file
- **CWE:** CWE-778: Insufficient Logging
- **Description:** Once auth is enforced, failed authentication attempts, rate-limit rejections, and input-validation errors should be logged with a stable correlation ID so abuse is detectable. Currently there is no logging at all.
- **Evidence:** n/a (absence).
- **Recommendation:** Emit structured logs (`console.warn` piped to stdout is acceptable for serverless/Vercel) on every 401/400, without echoing the token itself.

---

### A10:2025 — Mishandling of Exceptional Conditions

#### Medium — `JSON.parse` can throw and crash the app
- **File:** `app/hooks/use-local-storage.ts`
- **Line(s):** 10-14
- **CWE:** CWE-754: Improper Check for Unusual or Exceptional Conditions
- **Description:** If any external process writes invalid JSON to `kanban-todos`, the `useEffect` throws during mount and the whole board fails to render with no recovery path.
- **Evidence:**
  ```ts
  const stored = localStorage.getItem(key);
  if (stored) {
    setValue(JSON.parse(stored));
  }
  setLoaded(true);
  ```
- **Recommendation:** Wrap in `try/catch`; on parse failure, fall back to `initialValue` and clear the corrupted entry. (Same fix as A08.)

#### Low — `request.json()` is not guarded against malformed bodies
- **File:** `app/api/analytics/route.ts`
- **Line(s):** 21
- **CWE:** CWE-754
- **Description:** A malformed JSON body will throw a `SyntaxError` that becomes a 500. Best practice is to catch and return a 400.
- **Evidence:**
  ```ts
  const body = await request.json();
  ```
- **Recommendation:**
  ```ts
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  ```

---

## Risk Score Breakdown

Scoring: Critical = 10 pts, High = 7 pts, Medium = 4 pts, Low = 2 pts, Info = 0 pts.

| Category | Critical | High | Medium | Low | Info | Points |
|----------|----------|------|--------|-----|------|--------|
| A01 — Broken Access Control        | 0 | 1 | 1 | 0 | 0 | 11 |
| A02 — Security Misconfiguration    | 0 | 1 | 1 | 0 | 0 | 11 |
| A03 — Supply Chain Failures        | 0 | 0 | 0 | 1 | 1 | 2  |
| A04 — Cryptographic Failures       | 3 | 0 | 0 | 0 | 0 | 30 |
| A05 — Injection                    | 1 | 1 | 0 | 0 | 0 | 17 |
| A06 — Insecure Design              | 0 | 0 | 2 | 0 | 0 | 8  |
| A07 — Authentication Failures      | 0 | 0 | 0 | 0 | 0 | 0  |
| A08 — Data Integrity Failures      | 0 | 0 | 0 | 1 | 0 | 2  |
| A09 — Logging & Alerting Failures  | 0 | 0 | 0 | 1 | 0 | 2  |
| A10 — Exceptional Conditions       | 0 | 0 | 1 | 1 | 0 | 6  |
| **Total**                           | 4 | 3 | 5 | 4 | 1 | **89** |

**Risk Rating:** 0-10 = Low | 11-30 = Moderate | 31-60 = High | 61+ = Critical → **Critical Risk**

Note: The A07 Critical is cross-referenced to A04 to avoid double-counting.

---

## Remediation Priority

1. **Purge hardcoded secrets and rotate them** (A04, Critical). The `OPENAI_API_KEY` and `INTERNAL_API_TOKEN` values must be removed from source, the git history rewritten or the keys rotated, and the values moved to `process.env`. This is urgent because the keys have already leaked to anyone with repo access.
2. **Stop returning the secret in the response body** (A04, Critical). Even before rotation finishes, removing the `key` field from `NextResponse.json(...)` stops further exfiltration to any user who hits the endpoint.
3. **Fix the SQL injection template and the reflected XSS** (A05, Critical + High). Replace the string-concatenated query with input validation + parameterised queries, and return JSON (or HTML-escape) instead of reflecting `body.name` into an HTML template.
4. **Enforce authentication on the Route Handler** (A01, High). Validate the `Authorization` header against `process.env.ANALYTICS_API_TOKEN` and return 401 on mismatch, rather than fail-open.
5. **Add security response headers** (A02, High). Configure `headers()` in `next.config.ts` with CSP, HSTS, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`, and `X-Frame-Options: DENY`.
6. **Harden `useLocalStorage`** (A08/A10). Wrap `JSON.parse` in try/catch and validate shape, so tampered or malformed storage cannot crash the board.
7. **Follow-up (not in this PR): add rate limiting + CI dependency scanning** (A06, A03).

---

## Methodology

This audit was performed using static analysis against the OWASP Top 10:2025 framework. Each category was evaluated using pattern-matching (Grep), code review (Read), dependency analysis, and configuration inspection. The analysis covered source code under `app/`, configuration files (`next.config.ts`, `eslint.config.mjs`, `tsconfig.json`), dependency manifests (`package.json`, `package-lock.json`), and `.gitignore`.

**Limitations:** This is a static analysis — it does not include dynamic/runtime testing, penetration testing, or network-level analysis. Some vulnerabilities may only be discoverable through dynamic testing.

## References

- [OWASP Top 10:2025](https://owasp.org/Top10/2025/)
- [OWASP Application Security Verification Standard](https://owasp.org/www-project-application-security-verification-standard/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
