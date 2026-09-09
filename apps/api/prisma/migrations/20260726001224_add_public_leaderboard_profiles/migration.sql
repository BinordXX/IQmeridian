/*
  Warnings:

  - A unique constraint covering the columns `[publicProfileSlug]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "publicProfileAvatarUrl" TEXT,
ADD COLUMN     "publicProfileBio" TEXT,
ADD COLUMN     "publicProfileEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "publicProfileHeadline" TEXT,
ADD COLUMN     "publicProfileLocation" TEXT,
ADD COLUMN     "publicProfileQuote" TEXT,
ADD COLUMN     "publicProfileSlug" TEXT,
ADD COLUMN     "publicProfileWebsiteUrl" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_publicProfileSlug_key" ON "User"("publicProfileSlug");

-- CreateIndex
CREATE INDEX "User_publicProfileEnabled_idx" ON "User"("publicProfileEnabled");
