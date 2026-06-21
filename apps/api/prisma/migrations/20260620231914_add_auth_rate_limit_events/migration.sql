-- CreateEnum
CREATE TYPE "AuthRateLimitAction" AS ENUM ('LOGIN', 'REGISTER', 'REGISTER_CANDIDATE', 'REFRESH');

-- CreateTable
CREATE TABLE "AuthRateLimitEvent" (
    "id" TEXT NOT NULL,
    "action" "AuthRateLimitAction" NOT NULL,
    "keyHash" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthRateLimitEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuthRateLimitEvent_action_keyHash_createdAt_idx" ON "AuthRateLimitEvent"("action", "keyHash", "createdAt");

-- CreateIndex
CREATE INDEX "AuthRateLimitEvent_createdAt_idx" ON "AuthRateLimitEvent"("createdAt");
