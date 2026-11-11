CREATE TABLE IF NOT EXISTS "IngestionRun" (
  "id" TEXT PRIMARY KEY,
  "source" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completed_at" TIMESTAMP(3),
  "summary" JSONB,
  "error" TEXT
);
CREATE INDEX IF NOT EXISTS "IngestionRun_source_started_at_idx" ON "IngestionRun"("source", "started_at" DESC);
