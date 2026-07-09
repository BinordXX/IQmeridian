-- CreateEnum
CREATE TYPE "EmailDeliveryStatus" AS ENUM ('NOT_SENT', 'SENT', 'FAILED');

-- AlterTable
ALTER TABLE "OrganisationAdminInvitation" ADD COLUMN     "emailDeliveryStatus" "EmailDeliveryStatus" NOT NULL DEFAULT 'NOT_SENT',
ADD COLUMN     "lastEmailFailure" TEXT,
ADD COLUMN     "lastEmailSentAt" TIMESTAMP(3);
