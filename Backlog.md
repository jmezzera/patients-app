# Backlog

## Security

### L1 — Rate limiting
No rate limiting is configured on any API endpoint. High-frequency abuse of auth-gated mutations (creating appointments, adding metrics, file uploads) is possible.

**Recommendation:** Add middleware-level rate limiting using `@upstash/ratelimit` with Vercel KV, or an equivalent solution. Prioritize auth-adjacent endpoints and write operations.

---

### L3 — `pnpm audit` in CI
Dependencies appear up to date, but no automated vulnerability scanning step is in the build pipeline.

**Recommendation:** Add `pnpm audit --audit-level=high` as a required CI step so newly introduced vulnerable packages are caught before merging.


## Productionizing

### Clerk prod instance

### Vercel prod / dev instances

### Neon Prod

### Neon local dev branch isolation
Currently the Vercel-Managed Neon integration sets `DATABASE_URL` for all environments (including Development) to the `main` branch. `vercel env pull` therefore gives developers a connection string pointing to the production database.

**Recommendation:** Either (a) switch to the Neon-Managed integration which has an opt-in `vercel-dev` persistent branch for local dev, or (b) document that each developer must create their own Neon branch (`dev/<name>`) and set `DATABASE_URL` manually in `.env.local`. Until resolved, local mutations risk hitting production data.

### Feature flagging (vercel?)

## AI

### Asking system about patient profile
    - Trends over time
    - Nutrition plan - `Can I eat X?`


## UI

### Branding

### DatePicker