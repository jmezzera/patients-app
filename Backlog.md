# Backlog

## Security

### L1 — Rate limiting
No rate limiting is configured on any API endpoint. High-frequency abuse of auth-gated mutations (creating appointments, adding metrics, file uploads) is possible.

**Recommendation:** Add middleware-level rate limiting using `@upstash/ratelimit` with Vercel KV, or an equivalent solution. Prioritize auth-adjacent endpoints and write operations.

---

### L3 — `pnpm audit` in CI
Dependencies appear up to date, but no automated vulnerability scanning step is in the build pipeline.

**Recommendation:** Add `pnpm audit --audit-level=high` as a required CI step so newly introduced vulnerable packages are caught before merging.
