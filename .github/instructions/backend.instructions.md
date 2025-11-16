---
applyTo: 'backend/src/*'
---

# Backend Rules for CoachFlow

These rules apply to the NestJS backend.

## Project Structure

- `src/app.module.ts` – root module
- `src/common/` – shared providers (filters, interceptors, guards, utils)
- `src/auth/` – auth module (JWT, guards, strategies)
- `src/[domain]/` – one module per domain (controller + service + dto + entity)
- Testing: `test/unit/**`, `test/e2e/**`

## Environment

- Use .env for configuration.
- Validate env vars with class-validator.
- Use `@nestjs/config` global module; read via `ConfigService` only in providers.
- Keep separate `.env` files per environment; never commit secrets.

## Security

- Enable CORS with explicit origins and `helmet` headers.
- Sanitize and validate all inputs through DTOs + `ValidationPipe` (whitelist, forbidNonWhitelisted, transform).

## API and Documentation

- Use `@nestjs/swagger` and annotate controllers/DTOs.
- Version API via URI or header for public releases.

## AI Guidelines

- Generate services with dependency injection.
- Include error handling in controllers.
- Optimize queries for performance.
- Prefer small, focused providers; keep controllers thin.
- Add unit tests for services and guards; e2e tests for routes (isolate DB per test).

---
