-- CreateEnum
CREATE TYPE "CandidateAccessMode" AS ENUM ('ONE_OFF', 'MANAGED_PROFILE');

-- CreateEnum
CREATE TYPE "CandidateResultVisibility" AS ENUM ('NONE', 'COMPLETION_ONLY', 'SUMMARY_ONLY', 'FULL_PERSONAL_REPORT');

-- CreateEnum
CREATE TYPE "CandidateHistoryVisibility" AS ENUM ('HIDDEN', 'CURRENT_ORG_HISTORY', 'ALL_USER_HISTORY');

-- CreateEnum
CREATE TYPE "ReassessmentMode" AS ENUM ('MANUAL_INVITATION_ONLY', 'RECURRING_ASSIGNMENT');

-- CreateEnum
CREATE TYPE "OrganisationParticipantType" AS ENUM ('CANDIDATE', 'EMPLOYEE', 'CONTRACTOR', 'STUDENT', 'OTHER');

-- CreateEnum
CREATE TYPE "OrganisationParticipantStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');

-- AlterTable
ALTER TABLE "Invitation" ADD COLUMN     "participantId" TEXT;

-- AlterTable
ALTER TABLE "Organisation" ADD COLUMN     "candidateAccessMode" "CandidateAccessMode" NOT NULL DEFAULT 'ONE_OFF',
ADD COLUMN     "candidateHistoryVisibility" "CandidateHistoryVisibility" NOT NULL DEFAULT 'HIDDEN',
ADD COLUMN     "candidateResultVisibility" "CandidateResultVisibility" NOT NULL DEFAULT 'COMPLETION_ONLY',
ADD COLUMN     "participantProfileRetentionDays" INTEGER,
ADD COLUMN     "reassessmentMode" "ReassessmentMode" NOT NULL DEFAULT 'MANUAL_INVITATION_ONLY';

-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "participantId" TEXT;

-- CreateTable
CREATE TABLE "OrganisationParticipant" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "participantType" "OrganisationParticipantType" NOT NULL DEFAULT 'CANDIDATE',
    "accessMode" "CandidateAccessMode" NOT NULL DEFAULT 'ONE_OFF',
    "status" "OrganisationParticipantStatus" NOT NULL DEFAULT 'ACTIVE',
    "externalReference" TEXT,
    "department" TEXT,
    "jobTitle" TEXT,
    "joinedAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganisationParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OrganisationParticipant_organisationId_idx" ON "OrganisationParticipant"("organisationId");

-- CreateIndex
CREATE INDEX "OrganisationParticipant_userId_idx" ON "OrganisationParticipant"("userId");

-- CreateIndex
CREATE INDEX "OrganisationParticipant_participantType_idx" ON "OrganisationParticipant"("participantType");

-- CreateIndex
CREATE INDEX "OrganisationParticipant_accessMode_idx" ON "OrganisationParticipant"("accessMode");

-- CreateIndex
CREATE INDEX "OrganisationParticipant_status_idx" ON "OrganisationParticipant"("status");

-- CreateIndex
CREATE UNIQUE INDEX "OrganisationParticipant_organisationId_userId_key" ON "OrganisationParticipant"("organisationId", "userId");

-- CreateIndex
CREATE INDEX "Invitation_participantId_idx" ON "Invitation"("participantId");

-- CreateIndex
CREATE INDEX "Organisation_candidateAccessMode_idx" ON "Organisation"("candidateAccessMode");

-- CreateIndex
CREATE INDEX "Organisation_reassessmentMode_idx" ON "Organisation"("reassessmentMode");

-- CreateIndex
CREATE INDEX "Session_participantId_idx" ON "Session"("participantId");

-- AddForeignKey
ALTER TABLE "OrganisationParticipant" ADD CONSTRAINT "OrganisationParticipant_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganisationParticipant" ADD CONSTRAINT "OrganisationParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "OrganisationParticipant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "OrganisationParticipant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
