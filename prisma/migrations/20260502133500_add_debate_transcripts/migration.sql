-- CreateEnum
CREATE TYPE "DebateTranscriptStatus" AS ENUM ('METADATA_ONLY', 'EXTRACTED', 'FAILED', 'STALE');

-- CreateTable
CREATE TABLE "Debate" (
    "id" TEXT NOT NULL,
    "house" "House" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "source_url" TEXT NOT NULL,
    "transcript_url" TEXT,
    "transcript_pages" INTEGER,
    "transcript_byte_length" INTEGER,
    "transcript_language" TEXT,
    "members" TEXT[],
    "lok_sabha_number" TEXT,
    "session_number" TEXT,
    "debate_type" TEXT,
    "related_bill_id" TEXT,
    "is_demo_seed" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Debate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DebateTranscript" (
    "id" TEXT NOT NULL,
    "debate_id" TEXT NOT NULL,
    "source_url" TEXT NOT NULL,
    "resolved_url" TEXT,
    "content_type" TEXT,
    "byte_length" INTEGER,
    "char_count" INTEGER NOT NULL DEFAULT 0,
    "text_hash" TEXT,
    "text" TEXT NOT NULL DEFAULT '',
    "status" "DebateTranscriptStatus" NOT NULL DEFAULT 'METADATA_ONLY',
    "error" TEXT,
    "extracted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "extracted_from_url" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DebateTranscript_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Debate_house_date_idx" ON "Debate"("house", "date");

-- CreateIndex
CREATE INDEX "Debate_source_url_idx" ON "Debate"("source_url");

-- CreateIndex
CREATE INDEX "Debate_related_bill_id_idx" ON "Debate"("related_bill_id");

-- CreateIndex
CREATE INDEX "Debate_debate_type_idx" ON "Debate"("debate_type");

-- CreateIndex
CREATE UNIQUE INDEX "DebateTranscript_debate_id_key" ON "DebateTranscript"("debate_id");

-- CreateIndex
CREATE INDEX "DebateTranscript_source_url_idx" ON "DebateTranscript"("source_url");

-- CreateIndex
CREATE INDEX "DebateTranscript_resolved_url_idx" ON "DebateTranscript"("resolved_url");

-- CreateIndex
CREATE INDEX "DebateTranscript_text_hash_idx" ON "DebateTranscript"("text_hash");

-- CreateIndex
CREATE INDEX "DebateTranscript_status_idx" ON "DebateTranscript"("status");

-- AddForeignKey
ALTER TABLE "Debate" ADD CONSTRAINT "Debate_related_bill_id_fkey" FOREIGN KEY ("related_bill_id") REFERENCES "Bill"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DebateTranscript" ADD CONSTRAINT "DebateTranscript_debate_id_fkey" FOREIGN KEY ("debate_id") REFERENCES "Debate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
