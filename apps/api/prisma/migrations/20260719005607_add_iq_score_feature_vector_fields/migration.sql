-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "PsychometricScoringMode" ADD VALUE 'HYBRID_PSYCHOMETRIC_IQ';
ALTER TYPE "PsychometricScoringMode" ADD VALUE 'ML_VALIDITY_ASSISTED_EXPERIMENTAL';
ALTER TYPE "PsychometricScoringMode" ADD VALUE 'ML_ABILITY_ESTIMATION_EXPERIMENTAL';

-- AlterTable
ALTER TABLE "PsychometricDomainScore" ADD COLUMN     "featureVector" JSONB,
ADD COLUMN     "iqCi90Lower" DOUBLE PRECISION,
ADD COLUMN     "iqCi90Upper" DOUBLE PRECISION,
ADD COLUMN     "iqPercentile" DOUBLE PRECISION,
ADD COLUMN     "iqScaleMean" DOUBLE PRECISION NOT NULL DEFAULT 100,
ADD COLUMN     "iqScaleSd" DOUBLE PRECISION NOT NULL DEFAULT 15,
ADD COLUMN     "iqScore" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "PsychometricScoreResult" ADD COLUMN     "featureSetVersion" TEXT NOT NULL DEFAULT 'iqmeridian-feature-set.0.1.0',
ADD COLUMN     "leaderboardEligible" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "leaderboardIneligibilityReasons" JSONB,
ADD COLUMN     "overallIqCi90Lower" DOUBLE PRECISION,
ADD COLUMN     "overallIqCi90Upper" DOUBLE PRECISION,
ADD COLUMN     "overallIqPercentile" DOUBLE PRECISION,
ADD COLUMN     "overallIqScaleMean" DOUBLE PRECISION NOT NULL DEFAULT 100,
ADD COLUMN     "overallIqScaleSd" DOUBLE PRECISION NOT NULL DEFAULT 15,
ADD COLUMN     "overallIqScore" DOUBLE PRECISION,
ADD COLUMN     "scoringEngineVersion" TEXT NOT NULL DEFAULT 'iqmeridian-cognitive-intelligence-engine.0.1.0',
ADD COLUMN     "scoringFeatureSummary" JSONB,
ADD COLUMN     "scoringFeatureVector" JSONB,
ADD COLUMN     "scoringModelFamily" TEXT NOT NULL DEFAULT 'HYBRID_PSYCHOMETRIC',
ADD COLUMN     "scoringModelVersion" TEXT NOT NULL DEFAULT 'hybrid-psychometric-iq.0.1.0',
ADD COLUMN     "scoringSignalsUsed" JSONB,
ADD COLUMN     "validityAdjusted" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "PsychometricDomainScore_iqScore_idx" ON "PsychometricDomainScore"("iqScore");

-- CreateIndex
CREATE INDEX "PsychometricScoreResult_overallIqScore_idx" ON "PsychometricScoreResult"("overallIqScore");

-- CreateIndex
CREATE INDEX "PsychometricScoreResult_leaderboardEligible_idx" ON "PsychometricScoreResult"("leaderboardEligible");

-- CreateIndex
CREATE INDEX "PsychometricScoreResult_scoringModelFamily_idx" ON "PsychometricScoreResult"("scoringModelFamily");

-- CreateIndex
CREATE INDEX "PsychometricScoreResult_scoringModelVersion_idx" ON "PsychometricScoreResult"("scoringModelVersion");

-- CreateIndex
CREATE INDEX "PsychometricScoreResult_featureSetVersion_idx" ON "PsychometricScoreResult"("featureSetVersion");
