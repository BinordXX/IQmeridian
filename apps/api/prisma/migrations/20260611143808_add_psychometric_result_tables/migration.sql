-- CreateEnum
CREATE TYPE "PsychometricAnalysisStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateTable
CREATE TABLE "PsychometricAnalysisRun" (
    "id" TEXT NOT NULL,
    "formId" TEXT,
    "formVersion" INTEGER,
    "scoringVersion" INTEGER,
    "reportVersion" INTEGER,
    "datasetScope" JSONB,
    "status" "PsychometricAnalysisStatus" NOT NULL DEFAULT 'PENDING',
    "serviceVersion" TEXT NOT NULL,
    "sampleSize" INTEGER,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PsychometricAnalysisRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemPsychometricMetric" (
    "id" TEXT NOT NULL,
    "analysisRunId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "domain" "AssessmentDomain" NOT NULL,
    "subdomain" TEXT,
    "itemFamily" TEXT,
    "intendedDifficulty" TEXT,
    "responseCount" INTEGER NOT NULL DEFAULT 0,
    "correctCount" INTEGER NOT NULL DEFAULT 0,
    "proportionCorrect" DOUBLE PRECISION,
    "averageResponseTimeSec" DOUBLE PRECISION,
    "medianResponseTimeSec" DOUBLE PRECISION,
    "omissionRate" DOUBLE PRECISION,
    "discriminationValue" DOUBLE PRECISION,
    "flags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ItemPsychometricMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormPsychometricMetric" (
    "id" TEXT NOT NULL,
    "analysisRunId" TEXT NOT NULL,
    "totalSessions" INTEGER NOT NULL DEFAULT 0,
    "completedSessions" INTEGER NOT NULL DEFAULT 0,
    "completionRate" DOUBLE PRECISION,
    "meanTotalScore" DOUBLE PRECISION,
    "medianTotalScore" DOUBLE PRECISION,
    "standardDeviation" DOUBLE PRECISION,
    "minimumScore" DOUBLE PRECISION,
    "maximumScore" DOUBLE PRECISION,
    "reliabilityEstimate" DOUBLE PRECISION,
    "averageCompletionTimeSec" DOUBLE PRECISION,
    "scoreDistributionSummary" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FormPsychometricMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DomainPsychometricMetric" (
    "id" TEXT NOT NULL,
    "analysisRunId" TEXT NOT NULL,
    "domain" "AssessmentDomain" NOT NULL,
    "itemCount" INTEGER NOT NULL DEFAULT 0,
    "responseCount" INTEGER NOT NULL DEFAULT 0,
    "meanScore" DOUBLE PRECISION,
    "scoreSpread" DOUBLE PRECISION,
    "omissionRate" DOUBLE PRECISION,
    "averageResponseTimeSec" DOUBLE PRECISION,
    "reliabilityEstimate" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DomainPsychometricMetric_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PsychometricAnalysisRun_formId_idx" ON "PsychometricAnalysisRun"("formId");

-- CreateIndex
CREATE INDEX "PsychometricAnalysisRun_status_idx" ON "PsychometricAnalysisRun"("status");

-- CreateIndex
CREATE INDEX "PsychometricAnalysisRun_startedAt_idx" ON "PsychometricAnalysisRun"("startedAt");

-- CreateIndex
CREATE INDEX "ItemPsychometricMetric_itemId_idx" ON "ItemPsychometricMetric"("itemId");

-- CreateIndex
CREATE INDEX "ItemPsychometricMetric_domain_idx" ON "ItemPsychometricMetric"("domain");

-- CreateIndex
CREATE UNIQUE INDEX "ItemPsychometricMetric_analysisRunId_itemId_key" ON "ItemPsychometricMetric"("analysisRunId", "itemId");

-- CreateIndex
CREATE UNIQUE INDEX "FormPsychometricMetric_analysisRunId_key" ON "FormPsychometricMetric"("analysisRunId");

-- CreateIndex
CREATE INDEX "DomainPsychometricMetric_domain_idx" ON "DomainPsychometricMetric"("domain");

-- CreateIndex
CREATE UNIQUE INDEX "DomainPsychometricMetric_analysisRunId_domain_key" ON "DomainPsychometricMetric"("analysisRunId", "domain");

-- AddForeignKey
ALTER TABLE "PsychometricAnalysisRun" ADD CONSTRAINT "PsychometricAnalysisRun_formId_fkey" FOREIGN KEY ("formId") REFERENCES "AssessmentForm"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemPsychometricMetric" ADD CONSTRAINT "ItemPsychometricMetric_analysisRunId_fkey" FOREIGN KEY ("analysisRunId") REFERENCES "PsychometricAnalysisRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemPsychometricMetric" ADD CONSTRAINT "ItemPsychometricMetric_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormPsychometricMetric" ADD CONSTRAINT "FormPsychometricMetric_analysisRunId_fkey" FOREIGN KEY ("analysisRunId") REFERENCES "PsychometricAnalysisRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DomainPsychometricMetric" ADD CONSTRAINT "DomainPsychometricMetric_analysisRunId_fkey" FOREIGN KEY ("analysisRunId") REFERENCES "PsychometricAnalysisRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
