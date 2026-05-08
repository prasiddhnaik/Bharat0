-- CreateTable
CREATE TABLE "AiDebateAnalysis" (
    "id" TEXT NOT NULL,
    "debate_id" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'gemma',
    "model" TEXT NOT NULL,
    "input_hash" TEXT NOT NULL,
    "analysis" JSONB NOT NULL,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiDebateAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AiDebateAnalysis_debate_id_language_provider_idx" ON "AiDebateAnalysis"("debate_id", "language", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "AiDebateAnalysis_debate_id_language_provider_model_input_ha_key" ON "AiDebateAnalysis"("debate_id", "language", "provider", "model", "input_hash");

-- AddForeignKey
ALTER TABLE "AiDebateAnalysis" ADD CONSTRAINT "AiDebateAnalysis_debate_id_fkey" FOREIGN KEY ("debate_id") REFERENCES "Debate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
