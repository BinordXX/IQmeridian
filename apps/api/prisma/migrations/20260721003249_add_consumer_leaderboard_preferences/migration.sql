-- AlterTable
ALTER TABLE "User" ADD COLUMN     "leaderboardDisplayName" TEXT,
ADD COLUMN     "leaderboardOptIn" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "User_leaderboardOptIn_idx" ON "User"("leaderboardOptIn");
