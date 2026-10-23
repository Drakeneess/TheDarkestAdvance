# Publishing backup and restore runbook

## Scope

The publication source of truth lives in PostgreSQL. A valid backup must include the complete Writer server database, especially:

- `published_stories`
- `published_chapters`
- `publication_audit_events`
- `sync_entities`
- `sync_changes`
- `sync_mutations`
- `sync_workspace_access`

Backing up only the public projection is not enough to reconstruct the editorial state that produced it.

The current production database is the PostgreSQL service in the Railway `writer` project. The Railway persistent volume is storage, not an independent backup copy.

## Baseline strategy

Use a portable PostgreSQL logical backup with `pg_dump` and store it outside the production Railway project in encrypted object storage.

Recommended baseline retention:

- 1 backup per day for 7 days
- 1 backup per week for 4 weeks
- 1 backup per month for 6 months

This is an operational baseline, not a contractual SLA. Increase frequency if the acceptable recovery point becomes shorter than 24 hours.

## Create a backup

Run from a trusted environment that already has access to `DATABASE_URL`.

```bash
pg_dump \
  --format=custom \
  --no-owner \
  --no-acl \
  --file "writer-$(date -u +%Y%m%dT%H%M%SZ).dump" \
  "$DATABASE_URL"
```

Do not print `DATABASE_URL`, commit it, paste it into tickets, or embed it in the backup filename.

After creation:

1. verify the dump file is non-empty;
2. calculate and store a SHA-256 checksum next to the backup;
3. upload both files to encrypted storage outside the production Railway project;
4. apply the retention policy only after the upload succeeds.

Example checksum:

```bash
sha256sum writer-*.dump > writer-backup.sha256
```

## Restore drill

Never test a restore directly against production.

Provision an isolated PostgreSQL database and expose its connection string only as `RESTORE_DATABASE_URL` in the trusted shell.

```bash
pg_restore \
  --clean \
  --if-exists \
  --no-owner \
  --no-acl \
  --dbname "$RESTORE_DATABASE_URL" \
  writer-YYYYMMDDTHHMMSSZ.dump
```

Then verify at minimum:

```sql
SELECT COUNT(*) FROM published_stories;
SELECT COUNT(*) FROM published_chapters;
SELECT COUNT(*) FROM publication_audit_events;
SELECT COUNT(*) FROM sync_entities;
```

Also verify a sample of published chapters by joining `published_chapters.sourceVersionId` with the corresponding audit trail and source entities.

A backup is not considered operationally trustworthy until a restore drill has succeeded.

## Production recovery procedure

1. stop editorial writes to the Writer server;
2. take a final emergency dump of the current database if it is still readable;
3. restore the selected known-good backup into a new PostgreSQL database;
4. run Prisma migrations with `npm run prisma:deploy` from `writer version/server`;
5. validate table counts and a sample of audit/sourceVersion links;
6. point the Writer server at the restored database;
7. validate `/health/db`;
8. validate the private publishing status route with an authenticated Writer session;
9. validate `/api/public/stories` and at least one public chapter;
10. only then resume editorial writes.

Prefer restoring into a new database and switching over instead of destructively overwriting the only production copy.

## Public projection recovery

`PublishedStory` and `PublishedChapter` are projections. If those tables are damaged while sync/source tables remain trustworthy, the safest recovery is still a database restore unless a dedicated projection rebuild command exists and has been verified.

Do not reconstruct public content by copying files from Codex: Codex is a consumer of the public API, not the editorial source of truth.

## Audit guarantees

`publication_audit_events` is append-only application data. Publishing code records the audit row in the same database transaction as the editorial mutation:

- `story.publish`
- `story.unpublish`
- `chapter.publish`
- `chapter.unpublish`

When an authenticated identity exists, `actorUserId` records it. Chapter publish/unpublish events preserve `sourceVersionId`, including chapter rows removed indirectly by story unpublish.

The audit table intentionally stores identifiers and timestamps, not authentication credentials or bearer tokens.

## Logging and secrets

The server logger explicitly redacts `req.headers.authorization`. Publishing code must never log:

- bearer tokens;
- `WRITER_AUTH_TOKENS`;
- `DATABASE_URL`;
- raw secret-bearing environment variables.

If request logging is customized later to include headers, keep the Authorization redaction in place.
