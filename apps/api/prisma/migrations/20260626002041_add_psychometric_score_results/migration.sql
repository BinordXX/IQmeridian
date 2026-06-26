-- CreateEnum
CREATE TYPE "PsychometricScoringStatus" AS ENUM ('SCORED', 'PARTIAL', 'INSUFFICIENT_DATA', 'FAILED');

-- CreateEnum
CREATE TYPE "PsychometricScoreBand" AS ENUM ('VERY_LOW', 'LOW', 'LOW_AVERAGE', 'AVERAGE', 'HIGH_AVERAGE', 'HIGH', 'VERY_HIGH', 'UNAVAILABLE');

-- CreateEnum
CREATE TYPE "PsychometricValiditySeverity" AS ENUM ('INFO', 'LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "PsychometricScoringMode" AS ENUM ('BASELINE_CLASSICAL', 'IRT_2PL_PROVISIONAL', 'IRT_3PL_PROVISIONAL', 'MULTIDIMENSIONAL_PROVISIONAL', 'HYBRID_RESEARCH');

-- CreateTable
CREATE TABLE "PsychometricScoreResult" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "contractVersion" TEXT NOT NULL,
    "scoringStatus" "PsychometricScoringStatus" NOT NULL,
    "overallRawScore" DOUBLE PRECISION NOT NULL,
    "overallMaxRawScore" DOUBLE PRECISION NOT NULL,
    "overallAccuracy" DOUBLE PRECISION,
    "overallTheta" DOUBLE PRECISION,
    "overallStandardScore" DOUBLE PRECISION,
    "overallPercentile" DOUBLE PRECISION,
    "overallScoreBand" "PsychometricScoreBand" NOT NULL,
    "overallStandardError" DOUBLE PRECISION,
    "overallCi90Lower" DOUBLE PRECISION,
    "overallCi90Upper" DOUBLE PRECISION,
    "overallTestInformation" DOUBLE PRECISION,
    "overallReliability" DOUBLE PRECISION,
    "overallInterpretation" TEXT NOT NULL,
    "timingTotalResponseTimeMs" INTEGER,
    "timingMedianResponseTimeMs" INTEGER,
    "timingSpeedIndex" DOUBLE PRECISION,
    "timingSpeedAccuracyTradeoff" TEXT,
    "timingRapidGuessingRate" DOUBLE PRECISION NOT NULL,
    "timingOmissionRate" DOUBLE PRECISION NOT NULL,
    "modelVersion" TEXT NOT NULL,
    "calibrationVersion" TEXT,
    "scoringModeUsed" "PsychometricScoringMode" NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL,
    "inputHash" TEXT,
    "warnings" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PsychometricScoreResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PsychometricDomainScore" (
    "id" TEXT NOT NULL,
    "resultId" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "rawScore" DOUBLE PRECISION NOT NULL,
    "maxRawScore" DOUBLE PRECISION NOT NULL,
    "accuracy" DOUBLE PRECISION,
    "theta" DOUBLE PRECISION,
    "standardScore" DOUBLE PRECISION,
    "percentile" DOUBLE PRECISION,
    "scoreBand" "PsychometricScoreBand" NOT NULL,
    "standardError" DOUBLE PRECISION,
    "ci90Lower" DOUBLE PRECISION,
    "ci90Upper" DOUBLE PRECISION,
    "testInformation" DOUBLE PRECISION,
    "reliability" DOUBLE PRECISION,
    "interpretation" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PsychometricDomainScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PsychometricValidityFlag" (
    "id" TEXT NOT NULL,
    "resultId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "severity" "PsychometricValiditySeverity" NOT NULL,
    "description" TEXT NOT NULL,
    "evidence" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PsychometricValidityFlag_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PsychometricScoreResult_sessionId_key" ON "PsychometricScoreResult"("sessionId");

-- CreateIndex
CREATE INDEX "PsychometricScoreResult_scoringStatus_idx" ON "PsychometricScoreResult"("scoringStatus");

-- CreateIndex
CREATE INDEX "PsychometricScoreResult_overallScoreBand_idx" ON "PsychometricScoreResult"("overallScoreBand");

-- CreateIndex
CREATE INDEX "PsychometricScoreResult_modelVersion_idx" ON "PsychometricScoreResult"("modelVersion");

-- CreateIndex
CREATE INDEX "PsychometricScoreResult_generatedAt_idx" ON "PsychometricScoreResult"("generatedAt");

-- CreateIndex
CREATE INDEX "PsychometricDomainScore_domain_idx" ON "PsychometricDomainScore"("domain");

-- CreateIndex
CREATE INDEX "PsychometricDomainScore_scoreBand_idx" ON "PsychometricDomainScore"("scoreBand");

-- CreateIndex
CREATE UNIQUE INDEX "PsychometricDomainScore_resultId_domain_key" ON "PsychometricDomainScore"("resultId", "domain");

-- CreateIndex
CREATE INDEX "PsychometricValidityFlag_code_idx" ON "PsychometricValidityFlag"("code");

-- CreateIndex
CREATE INDEX "PsychometricValidityFlag_severity_idx" ON "PsychometricValidityFlag"("severity");

-- AddForeignKey
ALTER TABLE "PsychometricScoreResult" ADD CONSTRAINT "PsychometricScoreResult_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PsychometricDomainScore" ADD CONSTRAINT "PsychometricDomainScore_resultId_fkey" FOREIGN KEY ("resultId") REFERENCES "PsychometricScoreResult"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PsychometricValidityFlag" ADD CONSTRAINT "PsychometricValidityFlag_resultId_fkey" FOREIGN KEY ("resultId") REFERENCES "PsychometricScoreResult"("id") ON DELETE CASCADE ON UPDATE CASCADE;
