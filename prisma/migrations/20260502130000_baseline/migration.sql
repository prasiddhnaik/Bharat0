-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "House" AS ENUM ('LOK_SABHA', 'RAJYA_SABHA', 'JOINT_SITTING', 'STATE_ASSEMBLY', 'STATE_COUNCIL');

-- CreateEnum
CREATE TYPE "BillType" AS ENUM ('ORDINARY', 'MONEY', 'FINANCIAL', 'CONSTITUTIONAL_AMENDMENT');

-- CreateEnum
CREATE TYPE "BillStage" AS ENUM ('DRAFT', 'INTRODUCED', 'LISTED', 'TAKEN_UP', 'REFERRED_COMMITTEE', 'COMMITTEE_REPORTED', 'PASSED_ORIGIN_HOUSE', 'TRANSMITTED_TO_OTHER_HOUSE', 'PASSED_SECOND_HOUSE', 'RETURNED_WITH_AMENDMENTS', 'JOINT_SITTING_POSSIBLE', 'JOINT_SITTING_PASSED', 'PRESIDENT_ASSENT_PENDING', 'ASSENTED', 'ACT_PUBLISHED', 'WITHDRAWN', 'LAPSED', 'INTRODUCED_LOK_SABHA', 'PASSED_LOK_SABHA', 'SENT_TO_RAJYA_SABHA', 'RAJYA_SABHA_RECOMMENDATION_PERIOD', 'RETURNED_WITH_RECOMMENDATIONS', 'DEEMED_PASSED_AFTER_14_DAYS');

-- CreateEnum
CREATE TYPE "SittingStatus" AS ENUM ('SCHEDULED', 'SAT', 'ADJOURNED', 'HOLIDAY', 'DEMO');

-- CreateEnum
CREATE TYPE "CommitteeType" AS ENUM ('STANDING', 'SELECT', 'JOINT', 'DEPARTMENT_RELATED');

-- CreateEnum
CREATE TYPE "AnswerStatus" AS ENUM ('LISTED', 'ANSWERED', 'DEFERRED');

-- CreateEnum
CREATE TYPE "TimelineEventType" AS ENUM ('SITTING_SCHEDULED', 'AGENDA_PUBLISHED', 'BILL_INTRODUCED', 'BILL_LISTED', 'BILL_TAKEN_UP', 'BILL_REFERRED_COMMITTEE', 'COMMITTEE_REPORT_TABLED', 'QUESTION_LISTED', 'QUESTION_ANSWERED', 'DEBATE_PUBLISHED', 'BILL_PASSED_ORIGIN_HOUSE', 'BILL_TRANSMITTED', 'BILL_PASSED_SECOND_HOUSE', 'BILL_ASSENTED', 'ACT_PUBLISHED', 'BILL_WITHDRAWN', 'BILL_LAPSED');

-- CreateTable
CREATE TABLE "Bill" (
    "id" TEXT NOT NULL,
    "title_en" TEXT NOT NULL,
    "title_hi" TEXT NOT NULL,
    "bill_number" TEXT NOT NULL,
    "bill_year" INTEGER NOT NULL,
    "bill_type" "BillType" NOT NULL,
    "origin_house" "House" NOT NULL,
    "current_stage" "BillStage" NOT NULL,
    "ministry" TEXT NOT NULL,
    "introduced_on" TIMESTAMP(3) NOT NULL,
    "latest_action_date" TIMESTAMP(3) NOT NULL,
    "source_url" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "is_demo_seed" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillAction" (
    "id" TEXT NOT NULL,
    "bill_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "house" "House" NOT NULL,
    "action_type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "source_url" TEXT NOT NULL,
    "is_demo_seed" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BillAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SittingDay" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "house" "House" NOT NULL,
    "session_name" TEXT NOT NULL,
    "status" "SittingStatus" NOT NULL,
    "is_demo_seed" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SittingDay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimelineEvent" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "house" "House" NOT NULL,
    "type" "TimelineEventType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "related_bill_id" TEXT,
    "source_url" TEXT NOT NULL,
    "is_demo_seed" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TimelineEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Committee" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "house" "House" NOT NULL,
    "type" "CommitteeType" NOT NULL,
    "source_url" TEXT NOT NULL,
    "is_demo_seed" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Committee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "house" "House" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "ministry" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "answer_status" "AnswerStatus" NOT NULL,
    "source_url" TEXT NOT NULL,
    "is_demo_seed" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Act" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "act_number" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "linked_bill_id" TEXT NOT NULL,
    "india_code_url" TEXT NOT NULL,
    "is_demo_seed" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Act_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiBillAnalysis" (
    "id" TEXT NOT NULL,
    "bill_id" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'groq',
    "model" TEXT NOT NULL,
    "input_hash" TEXT NOT NULL,
    "analysis" JSONB NOT NULL,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiBillAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillSourceText" (
    "id" TEXT NOT NULL,
    "bill_id" TEXT NOT NULL,
    "source_url" TEXT NOT NULL,
    "resolved_url" TEXT,
    "content_type" TEXT,
    "byte_length" INTEGER,
    "char_count" INTEGER NOT NULL DEFAULT 0,
    "text_hash" TEXT,
    "text" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'extracted',
    "error" TEXT,
    "extracted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillSourceText_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrimeMinisterProfile" (
    "id" TEXT NOT NULL,
    "term_ids" TEXT[],
    "summary" TEXT NOT NULL,
    "highlights" JSONB NOT NULL,
    "source_label" TEXT NOT NULL,
    "source_url" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrimeMinisterProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LokSabhaPowerSnapshot" (
    "id" TEXT NOT NULL,
    "prime_minister_term_ids" TEXT[],
    "lok_sabha" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "election_year" INTEGER NOT NULL,
    "largest_party" TEXT NOT NULL,
    "largest_party_seats" INTEGER NOT NULL,
    "runner_up_party" TEXT NOT NULL,
    "runner_up_seats" INTEGER NOT NULL,
    "governing_side" TEXT NOT NULL,
    "governing_seats" INTEGER,
    "majority_mark" INTEGER NOT NULL,
    "power_summary" TEXT NOT NULL,
    "composition" JSONB NOT NULL,
    "source_label" TEXT NOT NULL,
    "source_url" TEXT NOT NULL,
    "as_of" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LokSabhaPowerSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Bill_bill_year_bill_type_idx" ON "Bill"("bill_year", "bill_type");

-- CreateIndex
CREATE INDEX "Bill_origin_house_current_stage_idx" ON "Bill"("origin_house", "current_stage");

-- CreateIndex
CREATE INDEX "BillAction_bill_id_date_idx" ON "BillAction"("bill_id", "date");

-- CreateIndex
CREATE INDEX "BillAction_house_date_idx" ON "BillAction"("house", "date");

-- CreateIndex
CREATE INDEX "SittingDay_session_name_idx" ON "SittingDay"("session_name");

-- CreateIndex
CREATE UNIQUE INDEX "SittingDay_date_house_key" ON "SittingDay"("date", "house");

-- CreateIndex
CREATE INDEX "TimelineEvent_date_house_idx" ON "TimelineEvent"("date", "house");

-- CreateIndex
CREATE INDEX "TimelineEvent_type_idx" ON "TimelineEvent"("type");

-- CreateIndex
CREATE INDEX "TimelineEvent_related_bill_id_idx" ON "TimelineEvent"("related_bill_id");

-- CreateIndex
CREATE INDEX "Committee_house_type_idx" ON "Committee"("house", "type");

-- CreateIndex
CREATE INDEX "Question_house_date_idx" ON "Question"("house", "date");

-- CreateIndex
CREATE INDEX "Question_ministry_idx" ON "Question"("ministry");

-- CreateIndex
CREATE INDEX "Act_year_idx" ON "Act"("year");

-- CreateIndex
CREATE INDEX "Act_linked_bill_id_idx" ON "Act"("linked_bill_id");

-- CreateIndex
CREATE INDEX "AiBillAnalysis_bill_id_language_provider_idx" ON "AiBillAnalysis"("bill_id", "language", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "AiBillAnalysis_bill_id_language_provider_model_input_hash_key" ON "AiBillAnalysis"("bill_id", "language", "provider", "model", "input_hash");

-- CreateIndex
CREATE INDEX "BillSourceText_bill_id_idx" ON "BillSourceText"("bill_id");

-- CreateIndex
CREATE INDEX "BillSourceText_text_hash_idx" ON "BillSourceText"("text_hash");

-- CreateIndex
CREATE INDEX "BillSourceText_status_idx" ON "BillSourceText"("status");

-- CreateIndex
CREATE UNIQUE INDEX "BillSourceText_source_url_key" ON "BillSourceText"("source_url");

-- CreateIndex
CREATE INDEX "PrimeMinisterProfile_term_ids_idx" ON "PrimeMinisterProfile"("term_ids");

-- CreateIndex
CREATE UNIQUE INDEX "PrimeMinisterProfile_source_url_key" ON "PrimeMinisterProfile"("source_url");

-- CreateIndex
CREATE INDEX "LokSabhaPowerSnapshot_prime_minister_term_ids_idx" ON "LokSabhaPowerSnapshot"("prime_minister_term_ids");

-- CreateIndex
CREATE UNIQUE INDEX "LokSabhaPowerSnapshot_lok_sabha_election_year_period_key" ON "LokSabhaPowerSnapshot"("lok_sabha", "election_year", "period");

-- AddForeignKey
ALTER TABLE "BillAction" ADD CONSTRAINT "BillAction_bill_id_fkey" FOREIGN KEY ("bill_id") REFERENCES "Bill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimelineEvent" ADD CONSTRAINT "TimelineEvent_related_bill_id_fkey" FOREIGN KEY ("related_bill_id") REFERENCES "Bill"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Act" ADD CONSTRAINT "Act_linked_bill_id_fkey" FOREIGN KEY ("linked_bill_id") REFERENCES "Bill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiBillAnalysis" ADD CONSTRAINT "AiBillAnalysis_bill_id_fkey" FOREIGN KEY ("bill_id") REFERENCES "Bill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillSourceText" ADD CONSTRAINT "BillSourceText_bill_id_fkey" FOREIGN KEY ("bill_id") REFERENCES "Bill"("id") ON DELETE CASCADE ON UPDATE CASCADE;
