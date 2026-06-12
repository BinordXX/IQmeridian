-- CreateEnum
CREATE TYPE "PilotFormStatus" AS ENUM ('DRAFT', 'READY_FOR_REVIEW', 'LOCKED_FOR_PILOT', 'ACTIVE_PILOT', 'CLOSED', 'ARCHIVED');

-- AlterTable
ALTER TABLE "AssessmentForm" ADD COLUMN     "domainBlueprint" JSONB,
ADD COLUMN     "isLocked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lockedAt" TIMESTAMP(3),
ADD COLUMN     "lockedBy" TEXT,
ADD COLUMN     "pilotStatus" "PilotFormStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN     "reportVersion" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "scoringVersion" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "timingRules" JSONB,
ADD COLUMN     "versionLabel" TEXT DEFAULT 'v0.1';

-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "assessmentFormVersion" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "assessmentFormVersionLabel" TEXT,
ADD COLUMN     "formSnapshot" JSONB,
ADD COLUMN     "reportVersion" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "scoringVersion" INTEGER NOT NULL DEFAULT 1;

-- CreateIndex
CREATE INDEX "AssessmentForm_pilotStatus_idx" ON "AssessmentForm"("pilotStatus");

-- CreateIndex
CREATE INDEX "AssessmentForm_isLocked_idx" ON "AssessmentForm"("isLocked");

-- CreateIndex
CREATE INDEX "AssessmentForm_name_version_idx" ON "AssessmentForm"("name", "version");
