/*
  Warnings:

  - Added the required column `updatedAt` to the `FormItemMapping` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "FormItemMappingStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED', 'CANCELLED');

-- AlterTable
ALTER TABLE "FormItemMapping" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "status" "FormItemMappingStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Invitation" ADD COLUMN     "candidateUserId" TEXT,
ADD COLUMN     "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "currentSectionId" TEXT,
ADD COLUMN     "currentSectionOrder" INTEGER,
ADD COLUMN     "sectionEndsAt" TIMESTAMP(3),
ADD COLUMN     "sectionStartedAt" TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_candidateUserId_fkey" FOREIGN KEY ("candidateUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_currentSectionId_fkey" FOREIGN KEY ("currentSectionId") REFERENCES "AssessmentSection"("id") ON DELETE SET NULL ON UPDATE CASCADE;
