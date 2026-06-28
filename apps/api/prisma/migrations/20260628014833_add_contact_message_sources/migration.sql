-- CreateEnum
CREATE TYPE "ContactMessageSource" AS ENUM ('PUBLIC', 'CONSUMER', 'CANDIDATE', 'EMPLOYER', 'RESEARCHER', 'PLATFORM_ADMIN');

-- AlterTable
ALTER TABLE "ContactMessage" ADD COLUMN     "senderRole" TEXT,
ADD COLUMN     "senderUserId" TEXT,
ADD COLUMN     "source" "ContactMessageSource" NOT NULL DEFAULT 'PUBLIC';
