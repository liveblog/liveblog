---
description: Stop the local Liveblog dev stack. Data is preserved unless --wipe-data is passed.
---

If the user passed `--wipe-data` (or asked for something equivalent — "wipe
everything", "fresh start", "clean reset"), confirm with them first using
`AskUserQuestion`:

> Running with `--wipe-data` deletes all local database, Elasticsearch, and
> Redis state under `data/`. Your local blogs and users are gone, and the
> next setup will have to re-initialise the database. Continue?

Only proceed with `--wipe-data` if they confirm. For a normal stop (no
`--wipe-data`), proceed directly — it's idempotent and non-destructive.

Run `./scripts/dev/down.sh $ARGUMENTS` and relay its output.

**Always relay the note the script prints at the end about Docker still
running** — stopping the stack does not stop Docker itself, and people tend
to forget it keeps running in the background.
