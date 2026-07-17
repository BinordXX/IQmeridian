/*
  Warnings:

  - A unique constraint covering the columns `[sessionAccessTokenHash]` on the table `Session` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Session" DROP CONSTRAINT "Session_userId_fkey";

-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "applicantEmail" TEXT,
ADD COLUMN     "applicantName" TEXT,
ADD COLUMN     "consentAcceptedAt" TIMESTAMP(3),
ADD COLUMN     "sessionAccessTokenHash" TEXT,
ALTER COLUMN "userId" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionAccessTokenHash_key" ON "Session"("sessionAccessTokenHash");

-- CreateIndex
CREATE INDEX "Session_applicantEmail_idx" ON "Session"("applicantEmail");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
