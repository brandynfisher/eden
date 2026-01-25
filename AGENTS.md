# AGENTS

## Testing (Backend)
- Use **Yarn**, not npm. Always run and pass any tests you add or modify.

### Offline inspection tests (no network/Mongo)
These validate the v3 contract, schema registration, SSE parsing, and golden fixtures.

```
cd /Users/jmill/projects-old/eden/eden/apps/api
yarn test \
  tests/test/openapi-sessions-v3.test.ts \
  tests/test/sessions-v3-schemas.test.ts \
  tests/test/openapi-sessions-v3-ajv.test.ts \
  tests/test/sessions-v3-sse.test.ts \
  tests/test/sessions-v3-golden.test.ts
```

### General guidance
- If you write tests, you must run them to green and report the command used.
- Prefer adding offline tests when sandbox/network access is constrained.
- Do not add ad-hoc debug flags for logging; use existing logging mechanisms or add temporary logs that can be removed in the same change.
