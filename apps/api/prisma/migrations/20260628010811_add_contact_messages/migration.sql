-- CreateEnum
CREATE TYPE "ContactMessageEnquiryType" AS ENUM ('PRODUCT', 'EMPLOYER', 'RESEARCH', 'GOVERNANCE', 'GENERAL');

-- CreateEnum
CREATE TYPE "ContactMessageStatus" AS ENUM ('NEW', 'REVIEWED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "ContactMessage" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "organisation" TEXT,
    "enquiryType" "ContactMessageEnquiryType" NOT NULL DEFAULT 'GENERAL',
    "message" TEXT NOT NULL,
    "status" "ContactMessageStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContactMessage_pkey" PRIMARY KEY ("id")
);
