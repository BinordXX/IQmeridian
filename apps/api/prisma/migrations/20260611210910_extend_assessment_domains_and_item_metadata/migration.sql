-- CreateEnum
CREATE TYPE "ItemIntendedDifficulty" AS ENUM ('EASY', 'MODERATE', 'HARD', 'VERY_HARD');

-- CreateEnum
CREATE TYPE "ItemReviewStatus" AS ENUM ('NOT_REVIEWED', 'REVIEW_IN_PROGRESS', 'APPROVED_FOR_PILOT', 'NEEDS_REVISION', 'REJECTED');

-- CreateEnum
CREATE TYPE "PsychometricItemStatus" AS ENUM ('DRAFT', 'CONTENT_REVIEWED', 'PILOT_READY', 'UNDER_REVIEW', 'FLAGGED_AFTER_PILOT', 'RETIRED', 'CALIBRATED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AssessmentDomain" ADD VALUE 'VERBAL_REASONING';
ALTER TYPE "AssessmentDomain" ADD VALUE 'LOGICAL_REASONING';
ALTER TYPE "AssessmentDomain" ADD VALUE 'ANALYTICAL_PROBLEM_SOLVING';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AssessmentSectionType" ADD VALUE 'VERBAL';
ALTER TYPE "AssessmentSectionType" ADD VALUE 'LOGICAL';
ALTER TYPE "AssessmentSectionType" ADD VALUE 'ANALYTICAL';

-- AlterTable
ALTER TABLE "Item" ADD COLUMN     "cognitiveProcess" TEXT,
ADD COLUMN     "distractorRationale" JSONB,
ADD COLUMN     "estimatedResponseTimeSec" INTEGER,
ADD COLUMN     "intendedDifficulty" "ItemIntendedDifficulty",
ADD COLUMN     "itemFamily" TEXT,
ADD COLUMN     "itemRationale" TEXT,
ADD COLUMN     "lastReviewedAt" TIMESTAMP(3),
ADD COLUMN     "psychometricStatus" "PsychometricItemStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN     "reviewStatus" "ItemReviewStatus" NOT NULL DEFAULT 'NOT_REVIEWED',
ADD COLUMN     "stimulusType" TEXT,
ADD COLUMN     "subdomain" TEXT;
