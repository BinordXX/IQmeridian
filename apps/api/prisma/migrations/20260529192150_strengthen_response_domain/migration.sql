-- DropForeignKey
ALTER TABLE "Response" DROP CONSTRAINT "Response_sessionId_fkey";

-- AlterTable
ALTER TABLE "Response" ADD COLUMN     "submittedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Response_sessionId_idx" ON "Response"("sessionId");

-- CreateIndex
CREATE INDEX "Response_itemId_idx" ON "Response"("itemId");

-- AddForeignKey
ALTER TABLE "Response" ADD CONSTRAINT "Response_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;
