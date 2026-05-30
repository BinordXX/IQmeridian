/*
  Warnings:

  - A unique constraint covering the columns `[sessionId,visibility]` on the table `Report` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `Report` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Report" DROP CONSTRAINT "Report_sessionId_fkey";

-- DropIndex
DROP INDEX "Report_sessionId_key";

-- AlterTable
ALTER TABLE "Report" ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "scoreId" TEXT,
ADD COLUMN     "scoreSnapshot" JSONB,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE INDEX "Report_sessionId_idx" ON "Report"("sessionId");

-- CreateIndex
CREATE INDEX "Report_subjectUserId_idx" ON "Report"("subjectUserId");

-- CreateIndex
CREATE INDEX "Report_visibility_idx" ON "Report"("visibility");

-- CreateIndex
CREATE UNIQUE INDEX "Report_sessionId_visibility_key" ON "Report"("sessionId", "visibility");

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;
