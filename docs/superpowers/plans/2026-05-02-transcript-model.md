# Prisma Debate + Transcript Model Plan

## Summary

Add persistent `Debate` and `DebateTranscript` models so Prisma mode reads debate records from Neon instead of in-memory fallback data. Debate metadata stays small for dashboard queries, transcript body text lives separately, and catalog refreshes use non-destructive upserts.

## Key Decisions

- `Debate` stores list/detail metadata, including source URL, transcript URL, transcript byte hint, members, session metadata, and optional related Bill ID.
- `DebateTranscript` stores extraction state and heavy transcript text, keyed by unique `debate_id`.
- `DebateTranscript.status` is a closed enum: `METADATA_ONLY`, `EXTRACTED`, `FAILED`, `STALE`.
- Catalog upserts own metadata only. Extraction-owned fields are `text`, `text_hash`, `char_count`, `error`, `extracted_at`, and `extracted_from_url`.
- `Debate.transcript_byte_length` is a denormalized catalog hint; `DebateTranscript.byte_length` is the extraction-side measured value and may disagree.
- `STALE` is only produced when an `EXTRACTED` transcript has an `extracted_from_url` that differs from the new effective transcript URL. Resolved URL is preferred over source URL for the comparison.

## Implementation Notes

- Prisma migrations include a baseline for the pre-existing Neon schema and an additive debate/transcript migration.
- Seed mode still reads local generated/manual arrays.
- Prisma mode queries `prisma.debate.findMany/count` for `section=debates`.
- `scripts/upsert-debates.ts` uses `upsert`, never `deleteMany`.
- Transcript metadata updates intentionally omit extraction-owned fields.
- `members` is always a `string[]`; empty means `[]`.

## Verification

- Mapper verification covers `toDomainDebate`.
- Repository verification proves Prisma mode calls the `debate` model.
- Upsert-rule verification covers preservation, STALE-on-changed-URL, no-op same-URL, non-EXTRACTED URL changes, and resolved-URL precedence.
- DB/API verification confirms persisted debate rows and transcript metadata are readable from Neon.
