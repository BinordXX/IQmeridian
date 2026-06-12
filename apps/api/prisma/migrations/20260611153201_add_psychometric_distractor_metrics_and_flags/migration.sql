-- CreateEnum
CREATE TYPE "PsychometricFlagEntityType" AS ENUM ('FORM', 'DOMAIN', 'ITEM', 'DISTRACTOR');

-- CreateEnum
CREATE TYPE "PsychometricFlagType" AS ENUM ('TOO_EASY', 'TOO_HARD', 'WEAK_DISCRIMINATION', 'NEGATIVE_DISCRIMINATION', 'HIGH_OMISSION', 'TOO_SLOW', 'TOO_FAST', 'WEAK_DISTRACTOR', 'OVERATTRACTIVE_DISTRACTOR', 'POSSIBLE_AMBIGUITY', 'POSSIBLE_ANSWER_KEY_ISSUE', 'LOW_DOMAIN_SPREAD', 'LOW_FORM_RELIABILITY', 'LOW_SCORE_SPREAD');

-- CreateEnum
CREATE TYPE "PsychometricFlagSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "PsychometricFlagReviewStatus" AS ENUM ('OPEN', 'ACCEPTED', 'DISMISSED', 'NEEDS_REVISION', 'RESOLVED');

-- CreateTable
CREATE TABLE "DistractorPsychometricMetric" (
    "id" TEXT NOT NULL,
    "analysisRunId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "optionKey" TEXT NOT NULL,
    "optionLabel" TEXT,
    "selectionCount" INTEGER NOT NULL DEFAULT 0,
    "selectionPercentage" DOUBLE PRECISION,
    "highPerformerSelectionRate" DOUBLE PRECISION,
    "lowPerformerSelectionRate" DOUBLE PRECISION,
    "isCorrectOption" BOOLEAN NOT NULL DEFAULT false,
    "flags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DistractorPsychometricMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PsychometricFlag" (
    "id" TEXT NOT NULL,
    "analysisRunId" TEXT NOT NULL,
    "entityType" "PsychometricFlagEntityType" NOT NULL,
    "flagType" "PsychometricFlagType" NOT NULL,
    "severity" "PsychometricFlagSeverity" NOT NULL DEFAULT 'MEDIUM',
    "status" "PsychometricFlagReviewStatus" NOT NULL DEFAULT 'OPEN',
    "itemId" TEXT,
    "domain" "AssessmentDomain",
    "optionKey" TEXT,
    "message" TEXT NOT NULL,
    "evidence" JSONB,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PsychometricFlag_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DistractorPsychometricMetric_itemId_idx" ON "DistractorPsychometricMetric"("itemId");

-- CreateIndex
CREATE INDEX "DistractorPsychometricMetric_analysisRunId_idx" ON "DistractorPsychometricMetric"("analysisRunId");

-- CreateIndex
CREATE UNIQUE INDEX "DistractorPsychometricMetric_analysisRunId_itemId_optionKey_key" ON "DistractorPsychometricMetric"("analysisRunId", "itemId", "optionKey");

-- CreateIndex
CREATE INDEX "PsychometricFlag_analysisRunId_idx" ON "PsychometricFlag"("analysisRunId");

-- CreateIndex
CREATE INDEX "PsychometricFlag_itemId_idx" ON "PsychometricFlag"("itemId");

-- CreateIndex
CREATE INDEX "PsychometricFlag_entityType_idx" ON "PsychometricFlag"("entityType");

-- CreateIndex
CREATE INDEX "PsychometricFlag_flagType_idx" ON "PsychometricFlag"("flagType");

-- CreateIndex
CREATE INDEX "PsychometricFlag_severity_idx" ON "PsychometricFlag"("severity");

-- CreateIndex
CREATE INDEX "PsychometricFlag_status_idx" ON "PsychometricFlag"("status");

-- AddForeignKey
ALTER TABLE "DistractorPsychometricMetric" ADD CONSTRAINT "DistractorPsychometricMetric_analysisRunId_fkey" FOREIGN KEY ("analysisRunId") REFERENCES "PsychometricAnalysisRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DistractorPsychometricMetric" ADD CONSTRAINT "DistractorPsychometricMetric_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PsychometricFlag" ADD CONSTRAINT "PsychometricFlag_analysisRunId_fkey" FOREIGN KEY ("analysisRunId") REFERENCES "PsychometricAnalysisRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PsychometricFlag" ADD CONSTRAINT "PsychometricFlag_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE SET NULL ON UPDATE CASCADE;
