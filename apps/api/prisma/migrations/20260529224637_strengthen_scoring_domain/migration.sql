/*
  Warnings:

  - Added the required column `updatedAt` to the `Score` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Score" DROP CONSTRAINT "Score_sessionId_fkey";

-- AlterTable
ALTER TABLE "Score" ADD COLUMN     "abstractMaxScore" INTEGER,
ADD COLUMN     "domainScores" JSONB,
ADD COLUMN     "numericalMaxScore" INTEGER,
ADD COLUMN     "overallComposite" DOUBLE PRECISION,
ADD COLUMN     "overallMaxScore" INTEGER,
ADD COLUMN     "scoringMetadata" JSONB,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AddForeignKey
ALTER TABLE "Score" ADD CONSTRAINT "Score_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;
