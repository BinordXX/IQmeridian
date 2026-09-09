-- CreateEnum
CREATE TYPE "AssessmentFormStatus" AS ENUM ('DRAFT', 'INTERNAL', 'PUBLIC', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "FormSectionAssignmentStatus" AS ENUM ('ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ItemCalibrationStatus" AS ENUM ('UNCALIBRATED', 'CALIBRATION_READY', 'CALIBRATED', 'NEEDS_REVIEW', 'RETIRED');

-- CreateEnum
CREATE TYPE "ItemReviewEventAction" AS ENUM ('CREATED', 'UPDATED', 'SUBMITTED_FOR_REVIEW', 'REVIEW_STARTED', 'CHANGES_REQUESTED', 'APPROVED', 'REJECTED', 'ACTIVATED', 'DEACTIVATED', 'RETIRED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "SessionItemStatus" AS ENUM ('SELECTED', 'PRESENTED', 'ANSWERED', 'SKIPPED', 'OMITTED');

-- AlterEnum
ALTER TYPE "AssessmentDomain" ADD VALUE 'SPATIAL_REASONING';

-- AlterEnum
ALTER TYPE "AssessmentSectionType" ADD VALUE 'SPATIAL';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ItemReviewStatus" ADD VALUE 'SUBMITTED_FOR_REVIEW';
ALTER TYPE "ItemReviewStatus" ADD VALUE 'APPROVED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "PsychometricItemStatus" ADD VALUE 'ASSESSMENT_READY';
ALTER TYPE "PsychometricItemStatus" ADD VALUE 'FLAGGED_AFTER_PUBLIC_USE';

-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'SUPER_ADMIN';

-- AlterTable
ALTER TABLE "AssessmentForm" ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "createdByAdminId" TEXT,
ADD COLUMN     "deliveryItemCount" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN     "formStatus" "AssessmentFormStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN     "publishedAt" TIMESTAMP(3),
ADD COLUMN     "publishedByAdminId" TEXT,
ADD COLUMN     "randomizeItems" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "randomizeOptions" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "targetBankItemCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "AssessmentSection" ADD COLUMN     "deliveryItemCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "difficultyMix" JSONB,
ADD COLUMN     "targetBankItemCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "FormItemMapping" ADD COLUMN     "activatedAt" TIMESTAMP(3),
ADD COLUMN     "activatedByAdminId" TEXT,
ADD COLUMN     "deactivatedAt" TIMESTAMP(3),
ADD COLUMN     "sourceAssignmentId" TEXT;

-- AlterTable
ALTER TABLE "Item" ADD COLUMN     "activatedAt" TIMESTAMP(3),
ADD COLUMN     "activatedByUserId" TEXT,
ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "approvedByUserId" TEXT,
ADD COLUMN     "assignedFormId" TEXT,
ADD COLUMN     "assignedSectionId" TEXT,
ADD COLUMN     "averageResponseTimeMs" INTEGER,
ADD COLUMN     "calibratedAt" TIMESTAMP(3),
ADD COLUMN     "calibrationStatus" "ItemCalibrationStatus" NOT NULL DEFAULT 'UNCALIBRATED',
ADD COLUMN     "correctRate" DOUBLE PRECISION,
ADD COLUMN     "createdByUserId" TEXT,
ADD COLUMN     "difficultyBand" "ItemIntendedDifficulty",
ADD COLUMN     "difficultyEstimate" DOUBLE PRECISION,
ADD COLUMN     "discriminationEstimate" DOUBLE PRECISION,
ADD COLUMN     "exposureCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "guessingEstimate" DOUBLE PRECISION,
ADD COLUMN     "omissionRate" DOUBLE PRECISION,
ADD COLUMN     "rapidGuessingRate" DOUBLE PRECISION,
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "responseCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "retiredAt" TIMESTAMP(3),
ADD COLUMN     "retiredByUserId" TEXT,
ADD COLUMN     "reviewNotes" TEXT,
ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "reviewedByUserId" TEXT,
ADD COLUMN     "revisionRequestReason" TEXT,
ADD COLUMN     "sourceAssignmentId" TEXT,
ADD COLUMN     "submittedAt" TIMESTAMP(3),
ADD COLUMN     "submittedByUserId" TEXT;

-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "isReducedLength" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "itemSelectionSnapshot" JSONB,
ADD COLUMN     "randomizationSeed" TEXT,
ADD COLUMN     "requestedItemCount" INTEGER,
ADD COLUMN     "selectedItemCount" INTEGER;

-- CreateTable
CREATE TABLE "AssessmentFormSectionResearcherAssignment" (
    "id" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "researcherId" TEXT NOT NULL,
    "assignedByAdminId" TEXT,
    "targetItemCount" INTEGER NOT NULL DEFAULT 0,
    "status" "FormSectionAssignmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "dueAt" TIMESTAMP(3),
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssessmentFormSectionResearcherAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemReviewEvent" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "actorId" TEXT,
    "assignmentId" TEXT,
    "action" "ItemReviewEventAction" NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT,
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ItemReviewEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionItem" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "mappingId" TEXT,
    "itemId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "sectionPosition" INTEGER NOT NULL,
    "status" "SessionItemStatus" NOT NULL DEFAULT 'SELECTED',
    "selectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "presentedAt" TIMESTAMP(3),
    "answeredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SessionItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AssessmentFormSectionResearcherAssignment_formId_idx" ON "AssessmentFormSectionResearcherAssignment"("formId");

-- CreateIndex
CREATE INDEX "AssessmentFormSectionResearcherAssignment_sectionId_idx" ON "AssessmentFormSectionResearcherAssignment"("sectionId");

-- CreateIndex
CREATE INDEX "AssessmentFormSectionResearcherAssignment_researcherId_idx" ON "AssessmentFormSectionResearcherAssignment"("researcherId");

-- CreateIndex
CREATE INDEX "AssessmentFormSectionResearcherAssignment_assignedByAdminId_idx" ON "AssessmentFormSectionResearcherAssignment"("assignedByAdminId");

-- CreateIndex
CREATE INDEX "AssessmentFormSectionResearcherAssignment_status_idx" ON "AssessmentFormSectionResearcherAssignment"("status");

-- CreateIndex
CREATE INDEX "ItemReviewEvent_itemId_idx" ON "ItemReviewEvent"("itemId");

-- CreateIndex
CREATE INDEX "ItemReviewEvent_actorId_idx" ON "ItemReviewEvent"("actorId");

-- CreateIndex
CREATE INDEX "ItemReviewEvent_assignmentId_idx" ON "ItemReviewEvent"("assignmentId");

-- CreateIndex
CREATE INDEX "ItemReviewEvent_action_idx" ON "ItemReviewEvent"("action");

-- CreateIndex
CREATE INDEX "ItemReviewEvent_createdAt_idx" ON "ItemReviewEvent"("createdAt");

-- CreateIndex
CREATE INDEX "SessionItem_sessionId_idx" ON "SessionItem"("sessionId");

-- CreateIndex
CREATE INDEX "SessionItem_formId_idx" ON "SessionItem"("formId");

-- CreateIndex
CREATE INDEX "SessionItem_sectionId_idx" ON "SessionItem"("sectionId");

-- CreateIndex
CREATE INDEX "SessionItem_mappingId_idx" ON "SessionItem"("mappingId");

-- CreateIndex
CREATE INDEX "SessionItem_itemId_idx" ON "SessionItem"("itemId");

-- CreateIndex
CREATE INDEX "SessionItem_status_idx" ON "SessionItem"("status");

-- CreateIndex
CREATE UNIQUE INDEX "SessionItem_sessionId_itemId_key" ON "SessionItem"("sessionId", "itemId");

-- CreateIndex
CREATE UNIQUE INDEX "SessionItem_sessionId_position_key" ON "SessionItem"("sessionId", "position");

-- CreateIndex
CREATE INDEX "AssessmentForm_formStatus_idx" ON "AssessmentForm"("formStatus");

-- CreateIndex
CREATE INDEX "AssessmentForm_isActive_idx" ON "AssessmentForm"("isActive");

-- CreateIndex
CREATE INDEX "AssessmentForm_createdByAdminId_idx" ON "AssessmentForm"("createdByAdminId");

-- CreateIndex
CREATE INDEX "AssessmentForm_publishedByAdminId_idx" ON "AssessmentForm"("publishedByAdminId");

-- CreateIndex
CREATE INDEX "AssessmentSection_formId_idx" ON "AssessmentSection"("formId");

-- CreateIndex
CREATE INDEX "AssessmentSection_domain_idx" ON "AssessmentSection"("domain");

-- CreateIndex
CREATE INDEX "AssessmentSection_type_idx" ON "AssessmentSection"("type");

-- CreateIndex
CREATE INDEX "FormItemMapping_formId_idx" ON "FormItemMapping"("formId");

-- CreateIndex
CREATE INDEX "FormItemMapping_sectionId_idx" ON "FormItemMapping"("sectionId");

-- CreateIndex
CREATE INDEX "FormItemMapping_itemId_idx" ON "FormItemMapping"("itemId");

-- CreateIndex
CREATE INDEX "FormItemMapping_sourceAssignmentId_idx" ON "FormItemMapping"("sourceAssignmentId");

-- CreateIndex
CREATE INDEX "FormItemMapping_activatedByAdminId_idx" ON "FormItemMapping"("activatedByAdminId");

-- CreateIndex
CREATE INDEX "FormItemMapping_status_idx" ON "FormItemMapping"("status");

-- CreateIndex
CREATE INDEX "Item_domain_idx" ON "Item"("domain");

-- CreateIndex
CREATE INDEX "Item_status_idx" ON "Item"("status");

-- CreateIndex
CREATE INDEX "Item_reviewStatus_idx" ON "Item"("reviewStatus");

-- CreateIndex
CREATE INDEX "Item_psychometricStatus_idx" ON "Item"("psychometricStatus");

-- CreateIndex
CREATE INDEX "Item_calibrationStatus_idx" ON "Item"("calibrationStatus");

-- CreateIndex
CREATE INDEX "Item_intendedDifficulty_idx" ON "Item"("intendedDifficulty");

-- CreateIndex
CREATE INDEX "Item_difficultyBand_idx" ON "Item"("difficultyBand");

-- CreateIndex
CREATE INDEX "Item_createdByUserId_idx" ON "Item"("createdByUserId");

-- CreateIndex
CREATE INDEX "Item_assignedFormId_idx" ON "Item"("assignedFormId");

-- CreateIndex
CREATE INDEX "Item_assignedSectionId_idx" ON "Item"("assignedSectionId");

-- CreateIndex
CREATE INDEX "Item_sourceAssignmentId_idx" ON "Item"("sourceAssignmentId");

-- CreateIndex
CREATE INDEX "Item_approvedByUserId_idx" ON "Item"("approvedByUserId");

-- CreateIndex
CREATE INDEX "Session_assessmentFormId_idx" ON "Session"("assessmentFormId");

-- CreateIndex
CREATE INDEX "Session_status_idx" ON "Session"("status");

-- AddForeignKey
ALTER TABLE "AssessmentForm" ADD CONSTRAINT "AssessmentForm_createdByAdminId_fkey" FOREIGN KEY ("createdByAdminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentForm" ADD CONSTRAINT "AssessmentForm_publishedByAdminId_fkey" FOREIGN KEY ("publishedByAdminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentFormSectionResearcherAssignment" ADD CONSTRAINT "AssessmentFormSectionResearcherAssignment_formId_fkey" FOREIGN KEY ("formId") REFERENCES "AssessmentForm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentFormSectionResearcherAssignment" ADD CONSTRAINT "AssessmentFormSectionResearcherAssignment_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "AssessmentSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentFormSectionResearcherAssignment" ADD CONSTRAINT "AssessmentFormSectionResearcherAssignment_researcherId_fkey" FOREIGN KEY ("researcherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentFormSectionResearcherAssignment" ADD CONSTRAINT "AssessmentFormSectionResearcherAssignment_assignedByAdminI_fkey" FOREIGN KEY ("assignedByAdminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_assignedFormId_fkey" FOREIGN KEY ("assignedFormId") REFERENCES "AssessmentForm"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_assignedSectionId_fkey" FOREIGN KEY ("assignedSectionId") REFERENCES "AssessmentSection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_sourceAssignmentId_fkey" FOREIGN KEY ("sourceAssignmentId") REFERENCES "AssessmentFormSectionResearcherAssignment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_submittedByUserId_fkey" FOREIGN KEY ("submittedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_approvedByUserId_fkey" FOREIGN KEY ("approvedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_activatedByUserId_fkey" FOREIGN KEY ("activatedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_retiredByUserId_fkey" FOREIGN KEY ("retiredByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemReviewEvent" ADD CONSTRAINT "ItemReviewEvent_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemReviewEvent" ADD CONSTRAINT "ItemReviewEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemReviewEvent" ADD CONSTRAINT "ItemReviewEvent_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "AssessmentFormSectionResearcherAssignment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormItemMapping" ADD CONSTRAINT "FormItemMapping_sourceAssignmentId_fkey" FOREIGN KEY ("sourceAssignmentId") REFERENCES "AssessmentFormSectionResearcherAssignment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormItemMapping" ADD CONSTRAINT "FormItemMapping_activatedByAdminId_fkey" FOREIGN KEY ("activatedByAdminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionItem" ADD CONSTRAINT "SessionItem_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionItem" ADD CONSTRAINT "SessionItem_formId_fkey" FOREIGN KEY ("formId") REFERENCES "AssessmentForm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionItem" ADD CONSTRAINT "SessionItem_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "AssessmentSection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionItem" ADD CONSTRAINT "SessionItem_mappingId_fkey" FOREIGN KEY ("mappingId") REFERENCES "FormItemMapping"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionItem" ADD CONSTRAINT "SessionItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
