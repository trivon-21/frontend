# Airlux frontend: agent instructions

Read README.md, docs/MIGRATION.md, and docs/ORGANIZATION.md before editing. Update the task board and handoff at the end of each task.

## Working agreements
- Team-owned application in trivon-21. Preserve original authorship, workflows, API paths, status values, and permissions.
- Organization settings in the guide are recommendations: do not apply permission/ruleset changes as part of an unrelated task. Do not bypass protected refs to get a merge through.
- Integrate through short-lived branches targeting `dev`; `main` is for verified releases. Do not reset history or bulk-merge old branches.
- Pin dependencies and lockfiles. Use Node 24 (see .nvmrc) and npm 11. Never bypass peer dependencies.
- Work in coherent tasks that a developer can review in a one-hour session. Avoid unrelated rewrites.
- Record actual checks; distinguish passed, failed, skipped, and unverified. Never hide existing failures.
- Do not commit secrets or account credentials. Do not reset, seed, or migrate an unspecified database.
- Preserve team attribution. Credit Sathnuwan Dassana only for verified continuation work, with PR/release evidence when available.

## Architecture and checks
Angular standalone features live under src/app/features; shared UI lives under src/app/shared/ui. Keep business logic in existing services. Spartan is Angular UI, not React shadcn. Inspect installed component source before composing overlays. Retain legacy theme compatibility until consumers migrate.

Run `npm ci`, `npm run build`, and `npm test -- --watch=false --browsers=ChromeHeadless`. Test keyboard focus, mobile layout, and real HTTP contracts for the dispatch pilot. Public build configuration must not contain secrets or silently default to localhost.
