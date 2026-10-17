# Save

One career document lives in `localStorage` under `devlife:v1`. Zustand persist stores `version` and runs `migrate`. The current number is `PERSIST_VERSION` in `src/game/config.ts`. The tables are [`docs/db/schema.sql`](../db/schema.sql).

## Standing rule

Every schema change bumps the persist version and adds a migration in `src/game/storage/migrate.ts`.

A schema change is a new or renamed column in `docs/db/schema.sql`, or a new required field on the persisted career document. A new optional field is still a schema change: existing saves must load through `migrateSave`.

The migration keeps money, skills, and progress, and fills every new field with a default. Players never need to clear storage.

Version notes sit next to `PERSIST_VERSION`. Version 8 is the store (owned items and the pin). A save from before the store owns nothing and wakes in the student room. Junior and senior rooms are bought in the store. Version 9 adds `cue` on a notice; a version 8 notice migrates with `cue` null and keeps the id and severity sound rules.
