-- AlterTable
ALTER TABLE "Invitation" ADD COLUMN     "emailDeliveryStatus" "EmailDeliveryStatus" NOT NULL DEFAULT 'NOT_SENT',
ADD COLUMN     "lastEmailFailure" TEXT,
ADD COLUMN     "lastEmailSentAt" TIMESTAMP(3);
